import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.lensiq.app";

type OfferDisplay = {
  programName?: string;
  status: string;
  installment: number;
  months: number;
  approvalProbability: number;
  reasons?: Array<{ message: string; impact: string }>;
};

export function Widget() {
  const params = new URLSearchParams(window.location.search);
  const customerId = params.get("customerId");
  const apiKey = params.get("apiKey");

  const [offers, setOffers] = useState<OfferDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId || !apiKey) {
      setError("Missing customerId or apiKey parameter");
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/evaluate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ application_id: Number(customerId) }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.offers) {
          setOffers(res.data.offers);
        } else {
          setError(res.message || "Failed to evaluate");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [customerId, apiKey]);

  if (loading) {
    return (
      <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
        Loading evaluation...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 20,
          fontFamily: "system-ui, sans-serif",
          color: "#dc2626",
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 400 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600 }}>
        Lens IQ Financing Options
      </h3>
      {offers.length === 0 && (
        <p style={{ color: "#6b7280", fontSize: 14 }}>
          No financing options available.
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {offers.slice(0, 3).map((offer, i) => (
          <div
            key={i}
            style={{
              padding: 12,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <strong style={{ fontSize: 14 }}>{offer.programName || `Program #${i + 1}`}</strong>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color:
                    offer.status === "APPROVED"
                      ? "#16a34a"
                      : offer.status === "CONDITIONAL"
                        ? "#d97706"
                        : "#dc2626",
                }}
              >
                {offer.status}
              </span>
            </div>
            <div style={{ fontSize: 13, color: "#374151" }}>
              {offer.installment > 0
                ? `${offer.installment.toLocaleString()} EGP/mo`
                : "—"}{" "}
              &middot; {offer.months} mo
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                fontWeight: 600,
                color: offer.approvalProbability > 70 ? "#16a34a" : "#d97706",
              }}
            >
              {offer.approvalProbability}% Approval Probability
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
