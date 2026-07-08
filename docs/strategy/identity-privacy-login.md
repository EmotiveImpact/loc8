# Identity, Privacy & Login

## Identity model

- Users get a persistent account with a **@handle** and a **friend graph**, so crews survive across events — add your people once, find them at every festival. This is what makes the consumer product sticky (Life360-style).
- The mesh already carries a stable `senderId` (uint32) per device. An account/handle maps to a stable key → `senderId`, so the design is **forward-compatible**: architect the account layer now, build it when the consumer product scales, and avoid a painful migration later.
- **Today (spike):** ephemeral per-device id + pairing (QR/link). Fine for the mesh test; **not** the consumer product.

## Two layers (the key mental model)

| Layer | Needs signal? | What happens |
|---|---|---|
| **Online** | Yes — done once, beforehand | Register handle, send/accept friend requests → phones exchange cryptographic keys. |
| **Offline (the mesh)** | No | The mesh recognises friends by their **cached keys**. `@sarah` resolves to a key, never a mesh-wide search. |

You never scan the mesh for a username among strangers — you match the handful of keys of people who opted into your crew.

## The iron privacy rule

- **Mutual consent only.** You can locate someone **only** if you've both agreed (they're in your crew).
- Never locate a stranger by username — that's stalking and a legal risk.
- **"Go dark" is always one tap away.**
- Location data is **end-to-end encrypted to your crew only**. The transport is treated as untrusted, so we encrypt at the app layer.

## Login

- **Sign in with Apple + Google** (low friction, iOS-first) + optional **phone number** (find-by-contacts). Apple sign-in is the natural default.
- **Backend:** accounts, handles, the friend graph, and key exchange need a small cloud. **Supabase** is the natural fit — Auth handles Apple/Google/phone, plus a DB for the friend graph.
- **Critical:** login is **online** (once, at onboarding, with signal); the app then works fully **offline** (keys cached). You never need to log in at the moment of use — you log in at home, find friends offline at the festival. Same constraint as buying a Crew Pass or pairing a crew: do it before signal dies.
- **B2B/SDK:** no separate Loc8 login — the guest is already logged into the cruise/park app; the SDK rides their identity.
- **Enterprise (Guard/Command):** staff log in via the operator's SSO.

## "What can the business see?" — the consent ladder

There is **no silent god-mode** over everyone's private location, and the system is **architected so it can't be built**.

**Who an operator can see:**

| Who | Can see? | Why |
|---|---|---|
| Own staff (guards / stewards / medics) | ✅ Full | They consented as a condition of the shift. |
| Attendees who tap SOS / "I need help" | ✅ Just them, just then | They initiated it. |
| Attendees who opt into "findable by medical" | ✅ Only those who chose it | Revocable. |
| A lost child in a family crew | ✅ By the **parent** | Consent already exists in the family. |
| Everyone else, silently | ❌ Never | — |

**Why it's real, not just a promise:** locations live **peer-to-peer, on devices, not in a central server** — there is no master map. To give an operator god-mode you'd have to **add** central tracking, which needs signal and breaks the model. Don't. Privacy is a **liability shield + moat + selling point** — operators don't want the liability of holding everyone's location either.

**The safe operator "overview":** an **anonymous crowd heatmap** — counts/density per zone, **no identities**. Legitimate and valuable (crowd-crush prevention).

**Lost-person / emergency:** build a **narrow, logged, audited** assisted-search tool — every use records who looked and why — **not** a browsable live map. For a genuinely endangered person, involve law enforcement with proper authority; minimal-data design means you can only hand over what exists.
