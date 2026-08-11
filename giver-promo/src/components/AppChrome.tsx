import React from "react";
import { colors, fonts } from "../theme";

export const AppChrome: React.FC<{
  children: React.ReactNode;
  fileName?: string;
}> = ({ children, fileName = "sample-statement.csv" }) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: colors.bg,
        fontFamily: fonts.body,
        color: colors.zinc100,
      }}
    >
      <aside
        style={{
          width: 240,
          borderRight: `1px solid ${colors.line}`,
          background: colors.bgElevated,
          padding: "28px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: fonts.display,
              fontSize: 36,
              letterSpacing: "-0.04em",
              color: colors.white,
            }}
          >
            Giver
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: colors.zinc500,
            }}
          >
            Who you give most
          </div>
        </div>
        {[
          { label: "Overview", active: true },
          { label: "People", active: false },
          { label: "Transactions", active: false },
          { label: "Insights", active: false },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              borderRadius: 10,
              padding: "12px 14px",
              background: item.active ? colors.white : "transparent",
              color: item.active ? "#000" : colors.zinc300,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {item.label}
          </div>
        ))}
      </aside>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header
          style={{
            borderBottom: `1px solid ${colors.line}`,
            padding: "14px 28px",
            fontSize: 13,
            color: colors.zinc300,
          }}
        >
          {fileName}
          <span style={{ color: colors.zinc600, marginLeft: 10 }}>
            See who gets the most from you
          </span>
        </header>
        <main style={{ flex: 1, padding: "24px 28px", overflow: "hidden" }}>
          {children}
        </main>
      </div>
    </div>
  );
};
