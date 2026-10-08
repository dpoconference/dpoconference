# Archived product scope

The active DPO Conference application is for conferences, seminars and continuing-learning courses. Membership is managed by a separate product and is not part of conference registration, attendee access, CPD or the LMS.

Existing source files, API capabilities, database models and stored records are retained. The routes and navigation below are hidden or redirected from this application; this is not a deletion or migration of membership data.

## Archived modules

- Membership applications, member directories, verification, renewals, fees, cards and member-only profiles
- Mentorship and professional-network/community management
- Career-centre and partnership workflows
- Membership-specific conference/seminar prices and membership-number verification
- Member-to-member messaging and group chat

Legacy source remains available in `src/routes/` and related API modules for a possible separate membership product. Do not add membership requirements to active conference or LMS workflows.

## Active conference and LMS lifecycle

- A conference waitlist signup is acknowledged by email immediately.
- When registration opens, people on the relevant conference or seminar waitlist receive an invitation to register.
- Eligible registration workflows create attendee LMS identities, but keep access unreleased until an admin selects participants and sends the secure account-setup email.
- Admin screens call conference attendees and seminar registrants participants, not members.
- Admins configure CPD points on each conference or seminar. Marking a linked participant as attended awards those points to their learning portal.
- The LMS supports free and paid courses for continuing learning after a conference.

## Related archived UI

See [membership.md](./membership.md) for the preserved membership homepage and navigation snippets.
