# Fortune Cookie — filter policy (Joshua 2026-09-22)

**Scope:** custom write-your-own fortunes only (starters are pre-cleared).

## Block
- Basic **profanity**
- **Hate speech**

## Do not block
- Ordinary adult talk, mild edge, sarcasm, flirtation, dark humor that isn’t hate
- Topic policing, “be nicer,” political correctness beyond hate
- Anything beyond the two categories above

**Voice on fail (chrome):** `Keep it friendly—please change this wording.`

**Implementation:** reuse Still Have It local `obscenity`/SHIFilter only as a narrow gate matching this scope. If the shared filter is broader than this policy, prefer FC-specific allowlist/trim over inventing a second moral filter. Not a safety certification.

**Assumption:** grownups.
