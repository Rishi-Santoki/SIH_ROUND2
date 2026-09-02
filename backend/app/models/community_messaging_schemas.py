from pydantic import BaseModel
from typing import Optional

class StartConversationRequest(BaseModel):
    alumni_id: str

class SendMessageRequest(BaseModel):
    message: str
    reply_to_id: Optional[str] = None

class EditMessageRequest(BaseModel):
    message: str
