# OTP email deliverability

Hermoso sends OTPs by email only. Configure the production mail provider with a verified sender domain, SPF and DKIM records, and a DMARC policy before release. Use a sender address on that verified domain, not a free mailbox, and monitor provider delivery events for bounces or spam placement.
