"""
s3_service.py — thin wrapper around boto3 for file uploads and presigned URLs.

Credential strategy (boto3 chain, no branches in code):
  Local dev:  AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY in .env  (or ~/.aws/credentials)
  EC2:        IAM role attached to the instance — boto3 picks it up automatically.
"""
from botocore.config import Config
import uuid
import os
from pathlib import Path
from typing import Optional

import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from fastapi import HTTPException, UploadFile

from backend.config import settings

# Module-level client — created once, reused across requests.
# boto3 handles credential refresh for temporary IAM-role tokens.
_s3_client = boto3.client(
    "s3",
    region_name=settings.AWS_REGION,
    endpoint_url=f"https://s3.{settings.AWS_REGION}.amazonaws.com",
    config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"}),
)

# Local storage fallback directory
LOCAL_STORAGE_DIR = Path(__file__).parent.parent / "local_storage"


def _build_key(category: str, filename: str) -> str:
    """
    S3 key format: {category}/{uuid4}_{original_filename}
    The UUID prevents collisions when two users upload the same filename.
    """
    safe_name = filename.replace(" ", "_")
    return f"{category}/{uuid.uuid4()}_{safe_name}"


async def upload_file(file: UploadFile, category: str) -> str:
    """
    Upload a file to S3 and return its key.
    Raises HTTP 502 if the upload fails — keeps error handling centralised.
    """
    s3_key = _build_key(category, file.filename or "unnamed")
    file_content = await file.read()

    try:
        _s3_client.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=s3_key,
            Body=file_content,
            ContentType=file.content_type or "application/octet-stream",
        )
    except NoCredentialsError:
        # Fallback to local storage for local development
        local_path = LOCAL_STORAGE_DIR / s3_key
        local_path.parent.mkdir(parents=True, exist_ok=True)
        with open(local_path, "wb") as f:
            f.write(file_content)
    except ClientError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"S3 upload failed: {exc.response['Error']['Message']}",
        ) from exc

    return s3_key


def generate_presigned_url(
    s3_key: str,
    expiry: Optional[int] = None,
) -> str:
    """
    Generate a short-lived presigned GET URL.
    The client fetches the file directly from S3 — the backend never proxies bytes.
    """
    expiry = expiry or settings.PRESIGNED_URL_EXPIRY
    try:
        url = _s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.S3_BUCKET_NAME, "Key": s3_key},
            ExpiresIn=expiry,
        )
        return url
    except NoCredentialsError:
        # Fallback to a local download URL for local development
        return f"/api/local-download/{s3_key}"
    except ClientError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to generate presigned URL: {exc.response['Error']['Message']}",
        ) from exc
