import logoUrl from "@/assets/logo.png";

export type MembershipDigitalCardProps = {
  firstName: string;
  lastName: string;
  categoryName: string;
  membershipNumber: string;
  membershipYear: number;
  status: string;
  expiresOn: string | Date;
  organisationName?: string | null;
  photoUrl?: string | null;
  qrDataUrl?: string | null;
};

function formatExpiry(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

/** Vertical CR80-style membership card (mint stripe template). */
export function MembershipDigitalCard({
  firstName,
  lastName,
  categoryName,
  membershipNumber,
  membershipYear,
  status,
  expiresOn,
  organisationName,
  photoUrl,
  qrDataUrl,
}: MembershipDigitalCardProps) {
  const first = (firstName || "").trim().toUpperCase() || "MEMBER";
  const last = (lastName || "").trim().toUpperCase();
  const initial = (first[0] || last[0] || "M").toUpperCase();

  return (
    <div className="membership-id-card" aria-label="Data Protection Officers Conference digital membership card">
      <div className="membership-id-card__pattern membership-id-card__pattern--top" aria-hidden />
      <div className="membership-id-card__pattern membership-id-card__pattern--bottom" aria-hidden />

      <div className="membership-id-card__brand">
        <img src={logoUrl} alt="" className="membership-id-card__logo" />
        <div>
          <p className="membership-id-card__brand-name">Data Protection Officers Conference</p>
          <p className="membership-id-card__brand-sub">Digital membership card</p>
        </div>
      </div>

      <div className="membership-id-card__body">
        <div className="membership-id-card__photo">
          {photoUrl ? (
            <img src={photoUrl} alt="" />
          ) : (
            <div className="membership-id-card__photo-fallback" aria-hidden>
              {initial}
            </div>
          )}
        </div>

        <div className="membership-id-card__info">
          <p className="membership-id-card__name-first">{first}</p>
          {last ? <p className="membership-id-card__name-last">{last}</p> : null}
          <p className="membership-id-card__role">{categoryName}</p>
          {organisationName ? <p className="membership-id-card__org">{organisationName}</p> : null}

          <dl className="membership-id-card__meta">
            <div>
              <dt>Membership no.</dt>
              <dd>{membershipNumber}</dd>
            </div>
            <div>
              <dt>Year</dt>
              <dd>{membershipYear}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{status}</dd>
            </div>
            <div>
              <dt>Expires</dt>
              <dd>{formatExpiry(expiresOn)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {qrDataUrl ? (
        <div className="membership-id-card__qr">
          <img src={qrDataUrl} alt="Membership verification QR" />
          <p>Scan to verify membership</p>
        </div>
      ) : null}
    </div>
  );
}
