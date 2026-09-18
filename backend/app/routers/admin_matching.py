from fastapi import APIRouter, Depends, HTTPException, Body
from supabase import Client
from typing import Optional, Dict
from datetime import datetime, timedelta
from app.dependencies import get_current_super_admin, get_db_client, log_admin_action

router = APIRouter(prefix="/admin/matching", tags=["Matching Outcomes"])

def aggregate_outcome_signals(client: Client, window_days: int = 90):
    cutoff = (datetime.utcnow() - timedelta(days=window_days)).isoformat()
    
    # 1. Fetch audit_logs for outcomes
    logs_res = client.table("audit_logs").select("*").in_("action", ["candidate_selected", "candidate_rejected", "mentor_rating_recorded"]).gte("created_at", cutoff).execute()
    logs = logs_res.data
    
    if not logs:
        return {"positive": [], "negative": []}
        
    app_ids = list(set([log["entity_id"] for log in logs if log["entity_type"] == "application"]))
    
    if not app_ids:
        return {"positive": [], "negative": []}
        
    # 2. Fetch applications for these IDs to get the frozen breakdown
    apps_res = client.table("applications").select("application_id, match_score_breakdown").in_("application_id", app_ids).execute()
    app_map = {app["application_id"]: app.get("match_score_breakdown", {}) for app in apps_res.data}
    
    positive = []
    negative = []
    
    for log in logs:
        if log["entity_type"] != "application":
            continue
            
        app_id = log["entity_id"]
        breakdown = app_map.get(app_id)
        if not breakdown:
            continue
            
        action = log["action"]
        details = log.get("details", {})
        
        if action == "candidate_selected":
            positive.append(breakdown)
        elif action == "candidate_rejected":
            negative.append(breakdown)
        elif action == "mentor_rating_recorded":
            rating = details.get("rating", 3)
            if rating >= 4:
                positive.append(breakdown)
            elif rating <= 2:
                negative.append(breakdown)
                
    return {"positive": positive, "negative": negative}

def propose_weight_adjustment(client: Client, window_days: int = 90):
    # 1. Gather signals
    signals = aggregate_outcome_signals(client, window_days)
    positive = signals["positive"]
    negative = signals["negative"]
    
    sample_size = min(len(positive), len(negative))
    
    if len(positive) < 30 or len(negative) < 30:
        return {"error": "Insufficient data", "positive_count": len(positive), "negative_count": len(negative)}
        
    # 2. Calculate means
    components = ["skill_compatibility", "assessment_evidence", "projects_experience", "eligibility", "career_interest"]
    pos_means = {c: 0 for c in components}
    neg_means = {c: 0 for c in components}
    
    for b in positive:
        for c in components:
            pos_means[c] += b.get(c, 0)
            
    for b in negative:
        for c in components:
            neg_means[c] += b.get(c, 0)
            
    for c in components:
        pos_means[c] = pos_means[c] / len(positive)
        neg_means[c] = neg_means[c] / len(negative)
        
    # 3. Analyze difference to find candidate for adjustment
    diffs = {c: pos_means[c] - neg_means[c] for c in components}
    
    # Sort differences to find the most distinguishing component (positive and negative)
    sorted_diffs = sorted(diffs.items(), key=lambda x: x[1], reverse=True)
    
    increase_candidate = sorted_diffs[0]
    decrease_candidate = sorted_diffs[-1]
    
    # Fetch current weights
    settings_res = client.table("platform_settings").select("setting_value").eq("setting_key", "match_score_weights").execute()
    if not settings_res.data:
        # Default fallback
        current_weights = {
            "skills": 0.40,
            "assessments": 0.20,
            "projects": 0.15,
            "eligibility": 0.10,
            "career_interest": 0.15
        }
    else:
        current_weights = settings_res.data[0]["setting_value"]
        
    # Mapping between breakdown keys and weight keys
    key_map = {
        "skill_compatibility": "skills",
        "assessment_evidence": "assessments",
        "projects_experience": "projects",
        "eligibility": "eligibility",
        "career_interest": "career_interest"
    }
    
    inc_key = key_map[increase_candidate[0]]
    dec_key = key_map[decrease_candidate[0]]
    
    # Check if there is a meaningful difference (e.g. at least 5 points difference in average scores)
    if increase_candidate[1] < 5:
        return {"error": "No significant patterns found to adjust weights.", "positive_count": len(positive), "negative_count": len(negative)}
        
    # Propose ±5% adjustment
    proposed_weights = current_weights.copy()
    
    # Clamp adjustment so we don't go below 0 or above 1
    adjust_amount = 0.05
    if proposed_weights[dec_key] - adjust_amount < 0.05:
        adjust_amount = proposed_weights[dec_key] - 0.05
        
    if adjust_amount <= 0:
        return {"error": "Cannot decrease the lowest component further."}
        
    proposed_weights[inc_key] += adjust_amount
    proposed_weights[dec_key] -= adjust_amount
    
    # Round to 2 decimals to prevent floating point drift
    proposed_weights = {k: round(v, 2) for k, v in proposed_weights.items()}
    
    rationale = f"Increasing {inc_key} and decreasing {dec_key} by {adjust_amount*100}%. Positive outcomes averaged {round(increase_candidate[1], 1)} points higher on {increase_candidate[0]}."
    
    # 4. Store proposal
    proposal_data = {
        "proposed_weights": proposed_weights,
        "based_on_sample_size": sample_size,
        "rationale": rationale,
        "status": "pending"
    }
    
    res = client.table("weight_adjustment_proposals").insert(proposal_data).execute()
    return res.data[0]


@router.post("/run-outcome-analysis")
def run_outcome_analysis(admin: dict = Depends(get_current_super_admin)):
    client: Client = admin["client"]
    result = propose_weight_adjustment(client)
    if "error" in result:
        return {"status": "skipped", "message": result["error"], "details": result}
    return {"status": "proposal_generated", "proposal": result}

@router.get("/weight-proposals")
def list_weight_proposals(status: Optional[str] = "pending", admin: dict = Depends(get_current_super_admin)):
    client: Client = admin["client"]
    query = client.table("weight_adjustment_proposals").select("*").order("created_at", desc=True)
    if status:
        query = query.eq("status", status)
    res = query.execute()
    return res.data

@router.patch("/weight-proposals/{proposal_id}/approve")
def approve_proposal(proposal_id: str, admin: dict = Depends(get_current_super_admin)):
    client: Client = admin["client"]
    
    # 1. Fetch proposal
    prop_res = client.table("weight_adjustment_proposals").select("*").eq("proposal_id", proposal_id).execute()
    if not prop_res.data:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    proposal = prop_res.data[0]
    if proposal["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Proposal already {proposal['status']}")
        
    # 2. Update platform settings
    # Match Score Weights
    # Upsert the settings
    old_res = client.table("platform_settings").select("setting_value").eq("setting_key", "match_score_weights").execute()
    old_weights = old_res.data[0]["setting_value"] if old_res.data else {}
    
    client.table("platform_settings").upsert({
        "setting_key": "match_score_weights",
        "setting_value": proposal["proposed_weights"]
    }).execute()
    
    # Increment weights version
    ver_res = client.table("platform_settings").select("setting_value").eq("setting_key", "weights_version").execute()
    curr_version = int(ver_res.data[0]["setting_value"]) if ver_res.data else 1
    new_version = curr_version + 1
    
    client.table("platform_settings").upsert({
        "setting_key": "weights_version",
        "setting_value": str(new_version)
    }).execute()
    
    # 3. Log to audit_logs
    log_admin_action(
        client,
        admin["user_id"],
        "match_weights_updated",
        "platform_settings",
        proposal_id,
        {
            "old_weights": old_weights,
            "new_weights": proposal["proposed_weights"],
            "sample_size": proposal.get("based_on_sample_size"),
            "proposal_id": proposal_id
        }
    )
    
    # 4. Update proposal status
    res = client.table("weight_adjustment_proposals").update({
        "status": "approved"
    }).eq("proposal_id", proposal_id).execute()
    
    return {"status": "approved", "new_weights_version": new_version}

@router.patch("/weight-proposals/{proposal_id}/reject")
def reject_proposal(proposal_id: str, payload: dict = Body(...), admin: dict = Depends(get_current_super_admin)):
    client: Client = admin["client"]
    notes = payload.get("notes")
    if not notes:
        raise HTTPException(status_code=400, detail="Notes required for rejection")
        
    res = client.table("weight_adjustment_proposals").update({
        "status": "rejected",
        "notes": notes
    }).eq("proposal_id", proposal_id).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    return res.data[0]
