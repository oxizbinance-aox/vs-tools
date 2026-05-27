import React, { useEffect, useState } from "react";
import { Store, Wand2, RefreshCcw } from "lucide-react";
import { listTemplates } from "../cloudProjects";
import { TEMPLATE_PRESETS } from "../presets";

export default function TemplateMarketplace({ onApplyTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      setLoading(true);

      const cloudTemplates = await listTemplates().catch(() => []);
      const localTemplates = TEMPLATE_PRESETS.map((item) => ({
        ...item,
        source: "local"
      }));

      setTemplates([...localTemplates, ...(cloudTemplates || [])]);
    } catch (err) {
      console.error(err);
      setTemplates(TEMPLATE_PRESETS.map((item) => ({ ...item, source: "local" })));
    } finally {
      setLoading(false);
    }
  }

  function applyTemplate(template) {
    const payload = template.data || {
      background: template.background,
      transition: template.transition,
      animation: template.animation
    };

    onApplyTemplate(payload);
  }

  return (
    <div style={styles.box}>
      <h3 style={styles.title}>
        <Store size={18} />
        Template Marketplace
      </h3>

      <button onClick={loadTemplates} style={styles.refresh}>
        <RefreshCcw size={15} />
        Refresh Templates
      </button>

      {loading && <p style={styles.muted}>Loading templates...</p>}

      <div style={styles.grid}>
        {templates.map((template) => (
          <div key={template.id} style={styles.card}>
            {template.preview_url ? (
              <img src={template.preview_url} alt={template.title} style={styles.preview} />
            ) : (
              <div style={styles.fakePreview}>
                <Wand2 size={24} />
              </div>
            )}

            <strong>{template.title}</strong>
            <p style={styles.category}>{template.category || "template"}</p>
            <p style={styles.desc}>{template.description || "Ready-to-use visual preset."}</p>

            <button onClick={() => applyTemplate(template)} style={styles.apply}>
              Apply Template
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  box: {
    background: "rgba(255,255,255,.07)",
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 20,
    padding: 16,
    marginTop: 16
  },
  title: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  refresh: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    gap: 8,
    alignItems: "center",
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 12,
    padding: 10,
    background: "rgba(255,255,255,.08)",
    color: "white",
    cursor: "pointer",
    marginBottom: 12
  },
  grid: {
    display: "grid",
    gap: 12
  },
  card: {
    padding: 12,
    borderRadius: 16,
    background: "rgba(0,0,0,.28)",
    border: "1px solid rgba(255,255,255,.1)"
  },
  preview: {
    width: "100%",
    height: 88,
    objectFit: "cover",
    borderRadius: 12,
    marginBottom: 10
  },
  fakePreview: {
    height: 88,
    borderRadius: 12,
    marginBottom: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "radial-gradient(circle at top left, rgba(255,47,179,.35), transparent 35%), linear-gradient(135deg,#050008,#171025,#000)"
  },
  category: {
    margin: "4px 0",
    color: "#ff8bd8",
    fontSize: 12
  },
  desc: {
    color: "rgba(255,255,255,.65)",
    fontSize: 13
  },
  apply: {
    width: "100%",
    border: 0,
    borderRadius: 12,
    padding: 10,
    background: "linear-gradient(135deg,#ff2fb3,#ffffff)",
    color: "#08000d",
    fontWeight: 900,
    cursor: "pointer"
  },
  muted: {
    color: "rgba(255,255,255,.58)"
  }
};