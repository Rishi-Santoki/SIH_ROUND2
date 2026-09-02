import os
import sys
from dotenv import load_dotenv

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)
load_dotenv(os.path.join(backend_dir, ".env"))

from app.core.embeddings import get_embedding
from app.dependencies import get_service_client

client = get_service_client()

CURRICULUMS = {
    "Python": """
Prerequisite: None
Sequence:
1. Fundamentals: Variables, Data Types, Control Flow, Functions.
2. Intermediate: Object-Oriented Programming, File I/O, Error Handling, Standard Library.
3. Advanced: Decorators, Generators, Concurrency, Asyncio.
Project: Build a CLI application or a web scraper.
Assessment: Code challenges involving algorithm implementation and OOP design.
""",
    "Machine Learning": """
Prerequisite: Python, Basic Math/Stats
Sequence:
1. Fundamentals: Supervised vs Unsupervised learning, Linear Regression, Logistic Regression.
2. Intermediate: Decision Trees, Random Forests, SVMs, Model Evaluation (Precision, Recall).
3. Advanced: Feature Engineering, Hyperparameter Tuning, Ensemble Methods.
Project: End-to-end classification pipeline on a real-world dataset.
Assessment: Case study evaluating model selection and metric interpretation.
""",
    "SQL": """
Prerequisite: None
Sequence:
1. Fundamentals: SELECT, WHERE, GROUP BY, ORDER BY.
2. Intermediate: Joins (INNER, LEFT, RIGHT), Subqueries, CTEs.
3. Advanced: Window Functions, Query Optimization, Indexing.
Project: Design a normalized schema and write analytical queries for a dashboard.
Assessment: Complex query writing and schema design questions.
""",
    "Deep Learning": """
Prerequisite: Machine Learning, Python
Sequence:
1. Fundamentals: Neural Networks basics, Backpropagation, Activation Functions.
2. Intermediate: Convolutional Neural Networks (CNNs), Recurrent Neural Networks (RNNs).
3. Advanced: Transformers, Transfer Learning, Optimization Algorithms (Adam, SGD).
Project: Image classification or sentiment analysis model using PyTorch/TensorFlow.
Assessment: Network architecture design and debugging.
""",
    "MLOps": """
Prerequisite: Machine Learning, Cloud Computing, Docker
Sequence:
1. Fundamentals: Model tracking (MLflow), Version Control for Data (DVC).
2. Intermediate: CI/CD for ML, Model Deployment (REST/gRPC).
3. Advanced: Model Monitoring, Drift Detection, Automated Retraining Pipelines.
Project: Deploy an ML model with automated testing and monitoring.
Assessment: Architecture design for a scalable ML deployment.
""",
    "Cloud Computing": """
Prerequisite: None
Sequence:
1. Fundamentals: IaaS, PaaS, SaaS, Core Services (Compute, Storage).
2. Intermediate: Networking, Identity and Access Management (IAM), Databases.
3. Advanced: Serverless, Infrastructure as Code (Terraform), High Availability.
Project: Deploy a scalable web application on AWS/GCP/Azure using IaC.
Assessment: Cloud architecture design and security best practices.
""",
    "Docker": """
Prerequisite: None
Sequence:
1. Fundamentals: Images, Containers, Dockerfile basics.
2. Intermediate: Volumes, Networking, Docker Compose.
3. Advanced: Multi-stage builds, Container Security, Orchestration basics.
Project: Containerize a multi-tier web application.
Assessment: Troubleshooting container issues and writing optimized Dockerfiles.
""",
    "React": """
Prerequisite: HTML, CSS, JavaScript
Sequence:
1. Fundamentals: JSX, Components, Props, State, Component Lifecycle.
2. Intermediate: Hooks (useState, useEffect), Context API, React Router.
3. Advanced: Performance Optimization (useMemo, useCallback), State Management (Redux/Zustand).
Project: Build a complex interactive dashboard or e-commerce frontend.
Assessment: Component design and state management scenarios.
""",
    "Network Security": """
Prerequisite: Networking basics
Sequence:
1. Fundamentals: Confidentiality, Integrity, Availability (CIA triad), Basic Cryptography.
2. Intermediate: Firewalls, VPNs, Intrusion Detection Systems (IDS), Common Vulnerabilities.
3. Advanced: Penetration Testing basics, Incident Response, Zero Trust Architecture.
Project: Implement and configure a secure network boundary or perform a vulnerability scan.
Assessment: Security incident analysis and mitigation strategies.
"""
}

def seed_curriculum():
    print("Seeding curriculum...")
    # Get super admin
    res = client.table("users").select("user_id").eq("email", "admin@aicp.edu").execute()
    admin_id = res.data[0]["user_id"] if res.data else None
    
    # Get skills
    skills_res = client.table("skills").select("skill_id, name").execute()
    skill_map = {s["name"].lower(): s["skill_id"] for s in skills_res.data}
    
    for name, content in CURRICULUMS.items():
        key = name.lower()
        if key not in skill_map:
            print(f"Skill {name} not found in database, skipping.")
            continue
            
        skill_id = skill_map[key]
        
        # Check if exists
        exist_res = client.table("knowledge_documents").select("document_id").eq("document_type", "skill_curriculum").eq("title", f"{name} Curriculum").execute()
        if exist_res.data:
            doc_id = exist_res.data[0]["document_id"]
            # Just clear chunks to re-add
            client.table("document_chunks").delete().eq("document_id", doc_id).execute()
        else:
            doc_res = client.table("knowledge_documents").insert({
                "title": f"{name} Curriculum",
                "document_type": "skill_curriculum",
                "source": "Platform Curated",
                "uploaded_by": admin_id,
                "access_level": "all"
            }).execute()
            doc_id = doc_res.data[0]["document_id"]
            
        print(f"Embedding and inserting chunks for {name}...")
        emb = get_embedding(content)
        client.table("document_chunks").insert({
            "document_id": doc_id,
            "content": content,
            "chunk_index": 0,
            "embedding": emb,
            "metadata": {"skill_id": skill_id, "skill_name": name}
        }).execute()
        
    print("Curriculum seeding complete.")

if __name__ == "__main__":
    seed_curriculum()
