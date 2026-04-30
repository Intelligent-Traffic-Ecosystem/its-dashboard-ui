"use client";

import { useState, useEffect } from "react";

interface Session {
  initials: string;
  name: string;
  email: string;
  role: string;
  roleClass: string;
  loginTime: string;
  lastActive: string;
  ip: string;
  status: "Active" | "Idle";
}

const mockSessions: Session[] = [
  {
    initials: "AK",
    name: "Alex Kovač",
    email: "akovac@itms.gov",
    role: "Senior Dispatch",
    roleClass: "bg-surface-bright border border-outline-variant font-label-caps text-label-caps text-on-surface",
    loginTime: "06:14:22 UTC",
    lastActive: "Just now",
    ip: "192.168.1.104",
    status: "Active",
  },
  {
    initials: "MR",
    name: "Maria Rossi",
    email: "mrossi@itms.gov",
    role: "Traffic Engineer",
    roleClass: "bg-surface-bright border border-outline-variant font-label-caps text-label-caps text-on-surface",
    loginTime: "07:30:00 UTC",
    lastActive: "2m ago",
    ip: "10.0.5.22",
    status: "Active",
  },
  {
    initials: "JL",
    name: "James Lee",
    email: "jlee@itms.gov",
    role: "Admin",
    roleClass: "bg-error-container border border-error/20 font-label-caps text-label-caps text-on-error-container",
    loginTime: "08:15:45 UTC",
    lastActive: "15m ago",
    ip: "192.168.1.50",
    status: "Idle",
  },
  {
    initials: "SW",
    name: "Sarah Wu",
    email: "swu@itms.gov",
    role: "Analyst",
    roleClass: "bg-surface-bright border border-outline-variant font-label-caps text-label-caps text-on-surface",
    loginTime: "09:00:12 UTC",
    lastActive: "Just now",
    ip: "10.0.5.88",
    status: "Active",
  },
];

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const [showModal, setShowModal] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState("");
  const [toast, setToast] = useState(false);

  // Auto-refresh every 30 seconds (mock)
  useEffect(() => {
    const interval = setInterval(() => {
      setSessions([...mockSessions]);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleForceLogout = (name: string) => {
    setSelectedOperator(name);
    setShowModal(true);
  };

  const handleConfirm = () => {
    setSessions((prev) => prev.filter((s) => s.name !== selectedOperator));
    setShowModal(false);
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg shadow-emerald-500/20 flex items-center gap-2 animate-[fadeIn_0.3s_ease-in-out]">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span className="font-title-sm text-sm">
            {selectedOperator} has been force logged out.
          </span>
        </div>
      )}

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container border border-white/10 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-error text-[28px]">
                person_remove
              </span>
              <h3 className="font-headline-md text-headline-md text-on-surface">
                Confirm Force Logout
              </h3>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              Force logout <span className="text-on-surface font-semibold">{selectedOperator}</span>
              ?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface hover:bg-white/5 transition-colors font-title-sm text-body-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 rounded-lg bg-error text-on-error hover:bg-error/90 transition-colors font-title-sm text-body-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-1">
            Active Sessions
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Manage and monitor current user activity across the ITMS infrastructure.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-surface-container border border-white/10 rounded px-4 py-2">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            group
          </span>
          <span className="font-mono-data text-mono-data text-primary">14</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant uppercase tracking-wider">
            operators currently active
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-surface-container border border-white/10 rounded overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-surface-container-high">
                <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">
                  Operator Name
                </th>
                <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">
                  Role
                </th>
                <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">
                  Login Time
                </th>
                <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">
                  Last Active
                </th>
                <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">
                  IP Address
                </th>
                <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">
                  Status
                </th>
                <th className="p-4 font-label-caps text-label-caps text-on-surface-variant text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sessions.map((session) => (
                <tr key={session.email} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-bright flex items-center justify-center text-primary font-mono-data text-mono-data border border-white/10">
                        {session.initials}
                      </div>
                      <div>
                        <p className="font-title-sm text-title-sm text-on-surface">
                          {session.name}
                        </p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {session.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded ${session.roleClass}`}
                    >
                      {session.role}
                    </span>
                  </td>
                  <td className="p-4 font-mono-data text-mono-data text-on-surface-variant">
                    {session.loginTime}
                  </td>
                  <td className="p-4 font-mono-data text-mono-data text-on-surface-variant">
                    {session.lastActive}
                  </td>
                  <td className="p-4 font-mono-data text-mono-data text-on-surface-variant">
                    {session.ip}
                  </td>
                  <td className="p-4">
                    {session.status === "Active" ? (
                      <span className="inline-flex items-center gap-1.5 text-primary">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(173,198,255,0.8)]"></span>
                        <span className="font-label-caps text-label-caps">Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-on-surface-variant">
                        <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                        <span className="font-label-caps text-label-caps">Idle</span>
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleForceLogout(session.name)}
                      className="px-3 py-1.5 rounded border border-outline-variant text-on-surface-variant hover:border-error hover:text-error hover:bg-error/10 transition-colors font-label-caps text-label-caps"
                    >
                      Force Logout
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-white/10 px-4 py-3 flex items-center justify-between bg-surface-container-low mt-auto">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Showing 1 to {sessions.length} of 14 sessions
          </p>
          <div className="flex items-center gap-2">
            <button className="p-1 rounded text-on-surface-variant hover:bg-white/5 transition-colors disabled:opacity-50">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="p-1 rounded text-on-surface-variant hover:bg-white/5 transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
