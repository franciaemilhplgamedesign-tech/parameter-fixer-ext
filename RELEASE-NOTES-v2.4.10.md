# EC-FIX-IT v2.4.10

- Fix false prompt-verification failures after successful ecomm checker uploads: wait for the editor update, reacquire replaced composer elements and tolerate whitespace/paragraph formatting differences.
- Continue verifying attachment readiness and enabled Send before closing the transfer window. Sending remains manual. Existing or changed drafts still stop the transfer to avoid overwrites.

Validation: sequential file/paste uploads, image-only attachments, multiline prompts, nonbreaking spaces and replacement editors tested with DOM fixtures. Live ChatGPT UI validation remains necessary.
