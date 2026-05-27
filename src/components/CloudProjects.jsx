import React, { useEffect, useState } from "react";
import { Cloud, Download, Save, Trash2 } from "lucide-react";
import {
  saveCloudProject,
  listCloudProjects,
  deleteCloudProject
} from "../cloudProjects";

export default function CloudProjects({ user, getProjectData, onLoadProject }) {
  const [title, setTitle] = useState("Untitled Project");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) refreshProjects();
  }, [user]);

  async function refreshProjects() {
    try {
      setLoading(true);
      const data = await listCloudProjects();
      setProjects(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function saveNow() {
    if (!user) return alert("Login dulu.");

    try {
      setLoading(true);

      await saveCloudProject({
        title,
        projectData: getProjectData()
      });

      await refreshProjects();
      alert("Project berhasil disimpan ke cloud.");
    } catch (err) {
      console.error(err);
      alert("Cloud save gagal.");
    } finally {
      setLoading(false);
    }
  }

  async function removeProject(id) {
    if (!confirm("Hapus project ini?")) return;

    try {
      await deleteCloudProject(id);
      await refreshProjects();
    } catch (err) {
      console.error(err);
      alert("Gagal hapus project.");
    }
  }

  if (!user) {
    return (
      <div style={styles.box}>
        <p>Login untuk memakai cloud save.</p>
      </div>
    );
  }

  return (
    <div style={styles.box}>
      <h3 style={styles.title}>
        <Cloud size={18} /> Cloud Projects
      </h3>

      <input
        style={styles.input}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Project title"
      />

      <button onClick={saveNow} style={styles.button}>
        <Save size={16} />
        Save to Cloud
      </button>

      <button onClick={refreshProjects} style={styles.secondary}>
        Refresh Projects
      </button>

      {loading && <p>Loading...</p>}

      {projects.map((project) => (
        <div key={project.id} style={styles.project}>
          <strong>{project.title}</strong>
          <p>{new Date(project.updated_at || project.created_at).toLocaleString()}</p>

          <div style={styles.row}>
            <button onClick={() => onLoadProject(project.data)} style={styles.smallButton}>
              <Download size={15} />
              Load
            </button>

            <button onClick={() => removeProject(project.id)} style={styles.danger}>
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
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
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    border: "1px solid rgba(255,47,179,.25)",
    background: "rgba(0,0,0,.35)",
    color: "white"
  },
  button: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    gap: 8,
    alignItems: "center",
    border: 0,
    borderRadius: 12,
    padding: 12,
    background: "linear-gradient(135deg,#ff2fb3,#ffffff)",
    color: "#08000d",
    fontWeight: 900,
    cursor: "pointer"
  },
  secondary: {
    width: "100%",
    marginTop: 8,
    border: "1px solid rgba(255,255,255,.15)",
    borderRadius: 12,
    padding: 10,
    background: "rgba(255,255,255,.08)",
    color: "white",
    cursor: "pointer"
  },
  project: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    background: "rgba(0,0,0,.28)",
    border: "1px solid rgba(255,255,255,.1)"
  },
  row: {
    display: "flex",
    gap: 8
  },
  smallButton: {
    display: "flex",
    gap: 6,
    alignItems: "center",
    border: 0,
    borderRadius: 10,
    padding: 9,
    cursor: "pointer"
  },
  danger: {
    border: 0,
    borderRadius: 10,
    padding: 9,
    color: "white",
    background: "rgba(255,47,79,.45)",
    cursor: "pointer"
  }
};