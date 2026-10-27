// Generated from the Anosmia prototype by scripts/extract-prototype.py.
// Markup, bindings and inline styles are carried over unchanged.
// Hand-maintained since Phase 1: re-running the extractor overwrites edits made here.
import { Fragment, type ReactNode } from "react";
import { css } from "../dc/css";
import type { Vals } from "./AnosmiaLogic";

type AriaBool = "true" | "false";

/**
 * In the app, a small Edit action beside the wine's name (correcting what the wine was). In demo mode
 * the content renders exactly as the prototype did. Only identity is editable: sensations, enjoyment,
 * notes and the date are the original account and have no edit control anywhere.
 */
function WithEdit({
  on,
  onEdit,
  children,
}: {
  on: boolean;
  onEdit: () => void;
  children: ReactNode;
}) {
  if (!on) return <>{children}</>;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "12px",
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>{children}</div>
      <button
        type="button"
        aria-label="Edit wine details"
        onClick={onEdit}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          height: "44px",
          padding: "0 14px",
          marginTop: "12px",
          flex: "none",
          borderRadius: "22px",
          border: "1.5px solid #1E1416",
          background: "transparent",
          fontWeight: 650,
          fontSize: "13.5px",
          color: "#1E1416",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        >
          <path d="M5 19l1-4L16 5l3 3L9 18z" />
        </svg>
        Edit
      </button>
    </div>
  );
}

export function AnosmiaView({ v, overlay }: { v: Vals; overlay?: ReactNode }) {
  return (
    <div className="f-ui grain" ref={css(v.frameStyle)}>
      {/* 1 · WELCOME */}
      {v.isWelcome ? (
        <>
          <div className={v.welcomeClass} ref={css(v.welcomeStyle)}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <svg
                  viewBox="0 0 64 96"
                  width="20"
                  height="30"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 5 C21 16 14 29 9.5 38 C7.5 42 9 46 13 46.5 C15.5 46.8 17 45.8 18.2 45 C20 52.5 25 58 32 58 C43 58 50.5 48 50.5 33 C50.5 22 48.5 12 46.5 5" />
                  <path d="M32 58 V86 M21 88 C26 86.5 38 86.5 43 88" />
                </svg>
                <span
                  style={{
                    fontWeight: "800",
                    fontSize: "25px",
                    letterSpacing: "-0.02em",
                    lineHeight: "1",
                  }}
                >
                  ANOSMIA
                </span>
              </div>
              <button
                className="f-mono"
                onClick={v.goJournal}
                style={{
                  height: "44px",
                  border: "0",
                  background: "transparent",
                  fontSize: "11px",
                  padding: "0 0 0 12px",
                }}
              >
                Journal
              </button>
            </div>
            <div
              style={{
                height: "1.5px",
                background: "#1E1416",
                marginTop: "10px",
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: "relative",
                height: "268px",
                marginTop: "4px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: "-54px",
                  top: "18px",
                  width: "248px",
                  height: "248px",
                  borderRadius: "50%",
                  background: "#F2CF5B",
                  border: "1.5px solid #1E1416",
                }}
              />{" "}
              <div
                className="dots"
                style={{
                  position: "absolute",
                  left: "42px",
                  top: "128px",
                  width: "132px",
                  height: "132px",
                  borderRadius: "50%",
                  opacity: "0.85",
                }}
              />{" "}
              <svg
                viewBox="0 0 64 96"
                width="150"
                height="225"
                style={{ position: "absolute", left: "132px", top: "22px" }}
                fill="none"
                stroke="#1E1416"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  d="M13 30 H50.4 C50.2 47 43 58 32 58 C25 58 20.3 53 18.2 45 C17 45.8 15.5 46.8 13 46.5 C9 46 7.5 42 9.5 38 C10.8 35.5 12 32.8 13 30 Z"
                  fill="#7E1F35"
                  stroke="none"
                />
                <path d="M23 5 C21 16 14 29 9.5 38 C7.5 42 9 46 13 46.5 C15.5 46.8 17 45.8 18.2 45 C20 52.5 25 58 32 58 C43 58 50.5 48 50.5 33 C50.5 22 48.5 12 46.5 5" />
                <path d="M18.2 45 C17 42.6 14.8 42.2 13.8 43.4" />
                <path d="M32 58 V86 M21 88 C26 86.5 38 86.5 43 88" />
              </svg>{" "}
              <div
                className="f-disp"
                style={{
                  position: "absolute",
                  left: "0",
                  top: "22px",
                  width: "112px",
                  height: "112px",
                  borderRadius: "50%",
                  border: "1.5px solid #1E1416",
                  background: "#FBF6EA",
                  transform: "rotate(-11deg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: "14px",
                  boxSizing: "border-box",
                  fontStyle: "italic",
                  fontSize: "14.5px",
                  lineHeight: "1.12",
                  fontWeight: "500",
                }}
              >
                Less tasting notes. More tasting.
              </div>{" "}
            </div>
            <h1
              className="f-disp"
              style={{
                margin: "14px 0 10px",
                fontSize: "48px",
                lineHeight: "0.94",
                fontWeight: "800",
                letterSpacing: "-0.025em",
              }}
            >
              Wine beyond aroma.
            </h1>
            <p
              style={{
                margin: "0 0 10px",
                fontSize: "16px",
                lineHeight: "1.45",
                color: "#3E302D",
              }}
            >
              Notice what your mouth can tell you: sweetness, sharpness, grip,
              weight, warmth and length. Then watch your own patterns appear.
            </p>
            <div
              className="f-mono"
              style={{ fontSize: "10.5px", color: "#5A1427" }}
            >
              No account · No quiz · Just a glass
            </div>
            <div
              style={{
                marginTop: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <button
                className="press"
                onClick={v.start}
                style={{
                  height: "62px",
                  borderRadius: "18px",
                  border: "1.5px solid #1E1416",
                  background: "#F2CF5B",
                  fontWeight: "700",
                  fontSize: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 22px",
                }}
              >
                <span>Start tasting</span>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 12h15M13 6l6 6-6 6" />
                </svg>
              </button>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                }}
              >
                <button
                  onClick={v.sample}
                  style={{
                    height: "48px",
                    border: "0",
                    background: "transparent",
                    fontWeight: "600",
                    fontSize: "13.5px",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                  }}
                >
                  Sample tasting
                </button>
                <button
                  onClick={v.startABwelcome}
                  style={{
                    height: "48px",
                    border: "0",
                    background: "transparent",
                    fontWeight: "600",
                    fontSize: "13.5px",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                  }}
                >
                  Two glasses?
                </button>
                <button
                  onClick={v.goJournal}
                  style={{
                    height: "48px",
                    border: "0",
                    background: "transparent",
                    fontWeight: "600",
                    fontSize: "13.5px",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                  }}
                >
                  The journal
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
      {/* 2 · FIND WINE */}
      {v.isFind ? (
        <>
          <div
            className="fade scroll"
            style={{
              position: "absolute",
              inset: "0 0 calc(172px + env(safe-area-inset-bottom, 0px)) 0",
              overflowY: "auto",
              padding: "8px 20px 20px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                height: "44px",
              }}
            >
              <button
                aria-label="Back"
                onClick={v.findBack}
                style={{
                  width: "44px",
                  height: "44px",
                  border: "0",
                  background: "transparent",
                  marginLeft: "-12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <span
                className="f-mono"
                style={{ fontSize: "10.5px", color: "#5E4E49" }}
              >
                Step 1 of 2 · Optional
              </span>
            </div>{" "}
            <h1
              className="f-disp"
              style={{
                margin: "8px 0 6px",
                fontSize: "38px",
                lineHeight: "0.98",
                fontWeight: "800",
                letterSpacing: "-0.02em",
              }}
            >
              Which wine is it?
            </h1>{" "}
            <p
              style={{ margin: "0 0 16px", fontSize: "14px", color: "#5E4E49" }}
            >
              Name it now, later, or never. No tasting notes appear here: you
              taste first.
            </p>{" "}
            <label htmlFor="q" className="sr">
              Search by producer, wine, variety or vintage
            </label>{" "}
            <div style={{ position: "relative" }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{ position: "absolute", left: "15px", top: "16px" }}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16 16l4.5 4.5" />
              </svg>{" "}
              <input
                id="q"
                type="search"
                value={v.query}
                onChange={v.onQuery}
                placeholder="Producer, wine, variety or vintage"
                autoComplete="off"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  height: "52px",
                  borderRadius: "14px",
                  border: "1.5px solid #1E1416",
                  background: "#FBF6EA",
                  padding: "0 14px 0 46px",
                  fontSize: "16px",
                }}
              />
            </div>{" "}
            <div
              className="f-mono"
              style={{
                fontSize: "10.5px",
                margin: "20px 0 6px",
                color: "#5E4E49",
              }}
            >
              {v.resultsHeading}
            </div>{" "}
            <div style={{ borderTop: "1.5px solid #1E1416" }}>
              {v.results.map((r, i1) => (
                <Fragment key={i1}>
                  {" "}
                  <button
                    onClick={r.pick}
                    aria-pressed={r.pressed as AriaBool}
                    ref={css(r.style)}
                  >
                    <span
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: "2px",
                        minWidth: "0",
                      }}
                    >
                      <span
                        className="f-disp"
                        style={{
                          fontSize: "18px",
                          fontWeight: "650",
                          lineHeight: "1.15",
                        }}
                      >
                        {r.title}
                      </span>
                      <span style={{ fontSize: "13px", color: "#5E4E49" }}>
                        {r.sub}
                      </span>
                    </span>{" "}
                    <span
                      className="f-mono"
                      style={{ fontSize: "10px", flex: "none" }}
                    >
                      {r.tag}
                    </span>
                  </button>{" "}
                </Fragment>
              ))}
            </div>{" "}
            {v.noResults ? (
              <>
                {" "}
                <p style={{ margin: "14px 0 0", fontSize: "14px" }}>
                  Nothing by that name in the sample cellar. Type it in instead,
                  or just taste it.
                </p>{" "}
              </>
            ) : null}{" "}
            <p
              className="f-mono"
              style={{
                fontSize: "9.5px",
                color: "#7A6A64",
                margin: "16px 0 0",
                lineHeight: "1.6",
              }}
            >
              Sample data. Producers are fictional, apart from Penfolds Grange.
            </p>
          </div>
          <div
            style={{
              position: "absolute",
              left: "0",
              right: "0",
              bottom: "0",
              padding:
                "12px 16px calc(18px + env(safe-area-inset-bottom, 0px))",
              background: "#F5ECD7",
              borderTop: "1.5px solid #1E1416",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "10px",
              }}
            >
              <button
                className="press"
                onClick={v.openCamera}
                style={{
                  height: "56px",
                  borderRadius: "16px",
                  border: "1.5px solid #1E1416",
                  background: "#FBF6EA",
                  fontWeight: "600",
                  fontSize: "15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                >
                  <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                  <circle cx="12" cy="13" r="3.5" />
                </svg>
                <span>{v.cameraLabel}</span>
              </button>
              <button
                className="press"
                onClick={v.openManual}
                style={{
                  height: "56px",
                  borderRadius: "16px",
                  border: "1.5px solid #1E1416",
                  background: "#FBF6EA",
                  fontWeight: "600",
                  fontSize: "15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                >
                  <path d="M5 19l1-4L16 5l3 3L9 18z" />
                </svg>
                <span>Type it in</span>
              </button>
            </div>
            <button
              className="press"
              onClick={v.findPrimary}
              style={{
                height: "62px",
                borderRadius: "18px",
                border: "1.5px solid #1E1416",
                background: "#F2CF5B",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 20px",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  display: "flex",
                  flexDirection: "column",
                  minWidth: "0",
                }}
              >
                <span
                  style={{
                    fontWeight: "700",
                    fontSize: "17px",
                    lineHeight: "1.15",
                  }}
                >
                  {v.findPrimaryLabel}
                </span>
                <span
                  style={{
                    fontSize: "12.5px",
                    color: "#3E302D",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {v.findPrimarySub}
                </span>
              </span>
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12h15M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </>
      ) : null}
      {/* 3 · RECORD SENSATIONS (upper half; controls live in the dock) */}
      {v.isRecord ? (
        <>
          <div
            className={v.guideBar ? "scroll guide-overview" : "fade scroll"}
            data-guide-open={v.guideBar && v.guideOpen ? "true" : "false"}
            inert={v.guideBar && v.guideOpen}
            style={{
              position: "absolute",
              inset: v.guideBar
                ? "0 0 calc(392px + env(safe-area-inset-bottom, 0px)) 0"
                : "0 0 calc(348px + env(safe-area-inset-bottom, 0px)) 0",
              overflowY: "auto",
              padding: "8px 16px 14px",
              boxSizing: "border-box",
            }}
          >
            <div
              data-pin=""
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                height: "44px",
              }}
            >
              <button
                aria-label="Back to wine"
                onClick={v.changeWine}
                style={{
                  width: "44px",
                  height: "44px",
                  border: "0",
                  background: "transparent",
                  marginLeft: "-12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <span
                className="f-mono"
                style={{ fontSize: "10.5px", color: "#5E4E49" }}
              >
                {v.tastingNo}
                {" · "}
                {v.answeredText}
              </span>
            </div>{" "}
            <h1
              className="f-disp"
              style={{
                margin: "2px 0 2px",
                fontSize: "31px",
                lineHeight: "1",
                fontWeight: "800",
                letterSpacing: "-0.02em",
              }}
            >
              What can you feel?
            </h1>{" "}
            <p
              style={{
                margin: "0 0 12px",
                fontSize: "13.5px",
                color: "#5E4E49",
              }}
            >
              Any order. Skip anything. “Can’t tell” is an answer.
            </p>{" "}
            <button
              onClick={v.changeWine}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                boxSizing: "border-box",
                padding: "6px 12px 6px 6px",
                borderRadius: "12px",
                border: "1.5px solid #1E1416",
                background: "#FBF6EA",
                textAlign: "left",
                marginBottom: "10px",
                minHeight: "54px",
              }}
            >
              <span
                style={{
                  width: "34px",
                  height: "42px",
                  borderRadius: "6px",
                  overflow: "hidden",
                  flex: "none",
                  display: "block",
                }}
              >
                {" "}
                {v.recTile.hasPhoto ? (
                  <>
                    <span ref={css(v.recTile.back)}>
                      <span ref={css(v.recTile.card)}>
                        <span ref={css(v.recTile.prodStyle)}>
                          {v.recTile.prod}
                        </span>
                        <span ref={css(v.recTile.titleStyle)}>
                          {v.recTile.title}
                        </span>
                        <span ref={css(v.recTile.vinStyle)}>
                          {v.recTile.vin}
                        </span>
                      </span>
                    </span>
                  </>
                ) : null}{" "}
                {v.recTile.noPhoto ? (
                  <>
                    <span ref={css(v.recTile.blankStyle)}>
                      <span ref={css(v.recTile.blankTextStyle)}>
                        {v.recTile.blankText}
                      </span>
                      <span ref={css(v.recTile.blankSubStyle)}>
                        {v.recTile.blankSub}
                      </span>
                    </span>
                  </>
                ) : null}{" "}
              </span>
              <span
                style={{
                  flex: "1",
                  minWidth: "0",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <span
                  style={{
                    fontWeight: "650",
                    fontSize: "14.5px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {v.sum.title}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#5E4E49",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {v.sum.sub}
                </span>
              </span>
              <span className="f-mono" style={{ fontSize: "10px" }}>
                Change
              </span>
            </button>{" "}
            <div style={{ borderTop: "1.5px solid #1E1416" }}>
              {v.rows.map((row, i2) => (
                <Fragment key={i2}>
                  {" "}
                  <button
                    onClick={row.tap}
                    aria-label={row.aria}
                    data-active={row.activeAttr}
                    ref={css(row.style)}
                  >
                    <span
                      className="f-mono"
                      style={{
                        fontSize: "10.5px",
                        width: "22px",
                        textAlign: "left",
                        flex: "none",
                      }}
                    >
                      {row.num}
                    </span>{" "}
                    <span
                      className="f-disp"
                      style={{
                        fontSize: "19px",
                        fontWeight: "650",
                        flex: "1",
                        textAlign: "left",
                      }}
                    >
                      {row.name}
                    </span>{" "}
                    <span ref={css(row.chipStyle)}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "flex-end",
                          gap: "2px",
                        }}
                      >
                        {row.bars.map((b, i3) => (
                          <Fragment key={i3}>
                            <span ref={css(b.style)} />
                          </Fragment>
                        ))}
                      </span>
                      <span>{row.chip}</span>
                    </span>
                  </button>{" "}
                </Fragment>
              ))}
            </div>
          </div>
        </>
      ) : null}
      {/* 4 · TASTING SUMMARY */}
      {v.isSummary ? (
        <>
          <div
            className="fade scroll"
            style={{
              position: "absolute",
              inset: "0 0 calc(112px + env(safe-area-inset-bottom, 0px)) 0",
              overflowY: "auto",
              padding: "8px 16px 26px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                height: "44px",
              }}
            >
              <button
                onClick={v.keepTasting}
                style={{
                  height: "44px",
                  border: "0",
                  background: "transparent",
                  marginLeft: "-8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 5l-7 7 7 7" />
                </svg>
                Keep tasting
              </button>
              <span
                className="f-mono"
                style={{ fontSize: "10.5px", color: "#5E4E49" }}
              >
                {v.summaryTag}
              </span>
            </div>{" "}
            <div style={{ display: "flex", gap: "14px", margin: "8px 0 20px" }}>
              <div
                style={{
                  width: "104px",
                  height: "132px",
                  borderRadius: "10px",
                  overflow: "hidden",
                  flex: "none",
                  border: "1.5px solid #1E1416",
                }}
              >
                {v.sumTile.hasPhoto ? (
                  <>
                    <div ref={css(v.sumTile.back)}>
                      <div ref={css(v.sumTile.card)}>
                        <span ref={css(v.sumTile.prodStyle)}>
                          {v.sumTile.prod}
                        </span>
                        <span ref={css(v.sumTile.titleStyle)}>
                          {v.sumTile.title}
                        </span>
                        <span ref={css(v.sumTile.vinStyle)}>
                          {v.sumTile.vin}
                        </span>
                      </div>
                    </div>
                  </>
                ) : null}{" "}
                {v.sumTile.noPhoto ? (
                  <>
                    <div ref={css(v.sumTile.blankStyle)}>
                      <span ref={css(v.sumTile.blankTextStyle)}>
                        {v.sumTile.blankText}
                      </span>
                      <span ref={css(v.sumTile.blankSubStyle)}>
                        {v.sumTile.blankSub}
                      </span>
                    </div>
                  </>
                ) : null}
              </div>
              <div
                style={{
                  flex: "1",
                  display: "flex",
                  flexDirection: "column",
                  minWidth: "0",
                }}
              >
                <div
                  className="f-mono"
                  style={{ fontSize: "10.5px", color: "#5E4E49" }}
                >
                  {v.sum.date}
                </div>
                <h1
                  className="f-disp"
                  style={{
                    margin: "4px 0 3px",
                    fontSize: "26px",
                    lineHeight: "1.02",
                    fontWeight: "800",
                    letterSpacing: "-0.015em",
                  }}
                >
                  {v.sum.title}
                </h1>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#5E4E49",
                    lineHeight: "1.35",
                  }}
                >
                  {v.sum.sub}
                </div>
                <div
                  style={{
                    marginTop: "auto",
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    paddingTop: "8px",
                  }}
                >
                  <button
                    onClick={v.identify}
                    style={{
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "20px",
                      border: "1.5px solid #1E1416",
                      background: "transparent",
                      fontWeight: "600",
                      fontSize: "13px",
                    }}
                  >
                    {v.sum.identifyLabel}
                  </button>
                  {v.sum.noPhoto ? (
                    <>
                      <button
                        onClick={v.openCamera}
                        style={{
                          height: "40px",
                          padding: "0 12px",
                          borderRadius: "20px",
                          border: "1.5px solid #1E1416",
                          background: "transparent",
                          fontWeight: "600",
                          fontSize: "13px",
                        }}
                      >
                        Add label photo
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>{" "}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                borderBottom: "1.5px solid #1E1416",
                paddingBottom: "6px",
              }}
            >
              <h2
                className="f-disp"
                style={{ margin: "0", fontSize: "22px", fontWeight: "750" }}
              >
                What you noticed
              </h2>
              <span
                className="f-mono"
                style={{ fontSize: "10px", color: "#5E4E49" }}
              >
                Tap a line to change it
              </span>
            </div>{" "}
            {v.sumRows.map((r, i4) => (
              <Fragment key={i4}>
                {" "}
                <button
                  onClick={r.edit}
                  aria-label={r.aria}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%",
                    minHeight: "54px",
                    padding: "0 2px",
                    border: "0",
                    borderBottom: "1px solid rgba(30,20,22,.2)",
                    background: "transparent",
                    textAlign: "left",
                  }}
                >
                  <span
                    className="f-mono"
                    style={{
                      fontSize: "10px",
                      width: "20px",
                      flex: "none",
                      color: "#5E4E49",
                    }}
                  >
                    {r.num}
                  </span>
                  <span
                    style={{
                      fontWeight: "650",
                      fontSize: "15px",
                      width: "112px",
                      flex: "none",
                    }}
                  >
                    {r.name}
                  </span>
                  <span style={{ display: "flex", gap: "3px", flex: "none" }}>
                    {r.cells.map((c, i5) => (
                      <Fragment key={i5}>
                        <span ref={css(c.style)} />
                      </Fragment>
                    ))}
                  </span>
                  <span ref={css(r.valStyle)}>{r.val}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    style={{ flex: "none", opacity: ".55" }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  >
                    <path d="M5 19l1-4L16 5l3 3L9 18z" />
                  </svg>
                </button>{" "}
              </Fragment>
            ))}{" "}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginTop: "12px",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "3px",
                  height: "46px",
                  padding: "0 10px 0 0",
                  borderRight: "1px solid rgba(30,20,22,.2)",
                }}
              >
                {v.sumFp.map((b, i6) => (
                  <Fragment key={i6}>
                    <span ref={css(b.style)} />
                  </Fragment>
                ))}
              </span>
              <span
                style={{
                  fontSize: "12.5px",
                  color: "#5E4E49",
                  lineHeight: "1.4",
                }}
              >
                Your fingerprint for this glass. Solid = level, ring = not
                noticed, stripes = can’t tell, dashed = unanswered.
              </span>
            </div>{" "}
            <h2
              className="f-disp"
              style={{
                margin: "26px 0 8px",
                fontSize: "22px",
                fontWeight: "750",
              }}
            >
              {"Your words "}
              <span
                className="f-mono"
                style={{
                  fontSize: "10px",
                  fontWeight: "400",
                  color: "#5E4E49",
                  verticalAlign: "middle",
                  marginLeft: "4px",
                }}
              >
                Optional
              </span>
            </h2>{" "}
            <label htmlFor="notes" className="sr">
              Personal notes
            </label>{" "}
            <textarea
              id="notes"
              value={v.notes}
              onChange={v.onNotes}
              rows={3}
              placeholder="Anything at all. No vocabulary required."
              style={{
                width: "100%",
                boxSizing: "border-box",
                minHeight: "92px",
                borderRadius: "14px",
                border: "1.5px solid #1E1416",
                background: "#FBF6EA",
                padding: "12px 14px",
                fontSize: "18px",
                lineHeight: "1.35",
                resize: "none",
                fontFamily: "'Fraunces', Georgia, serif",
                fontStyle: "italic",
              }}
            />{" "}
            <h2
              className="f-disp"
              style={{
                margin: "26px 0 2px",
                fontSize: "22px",
                fontWeight: "750",
              }}
            >
              Would you pour another?
            </h2>{" "}
            <p
              style={{ margin: "0 0 10px", fontSize: "13px", color: "#5E4E49" }}
            >
              Kept apart on purpose. Liking a wine and noticing it are different
              skills.
            </p>{" "}
            <div
              role="group"
              aria-label="Enjoyment"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: "6px",
              }}
            >
              {v.enjoyOpts.map((o, i7) => (
                <Fragment key={i7}>
                  <button
                    onClick={o.pick}
                    aria-pressed={o.pressed as AriaBool}
                    className={o.cls}
                    ref={css(o.style)}
                  >
                    <span aria-hidden="true" ref={css(o.glass)}>
                      <span ref={css(o.fill)} />
                    </span>
                    <span>{o.label}</span>
                  </button>
                </Fragment>
              ))}
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: "0",
              right: "0",
              bottom: "0",
              padding:
                "10px 16px calc(18px + env(safe-area-inset-bottom, 0px))",
              background: "#F5ECD7",
              borderTop: "1.5px solid #1E1416",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <span
              className="f-mono"
              style={{
                fontSize: "9.5px",
                color: "#5E4E49",
                textAlign: "center",
              }}
            >
              {v.saveHint}
            </span>
            <button
              className="press"
              onClick={v.save}
              style={{
                height: "60px",
                borderRadius: "18px",
                border: "1.5px solid #1E1416",
                background: "#F2CF5B",
                fontWeight: "700",
                fontSize: "17px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              Save to journal
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12.5l4.5 4.5L19 7" />
              </svg>
            </button>
          </div>
        </>
      ) : null}
      {/* 5 · JOURNAL */}
      {v.isJournal ? (
        <>
          <div
            className="fade scroll"
            style={{
              position: "absolute",
              inset: "0 0 calc(96px + env(safe-area-inset-bottom, 0px)) 0",
              overflowY: "auto",
              padding: "8px 16px 28px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                height: "44px",
              }}
            >
              <button
                aria-label="Anosmia home"
                onClick={v.goWelcome}
                style={{
                  height: "44px",
                  border: "0",
                  background: "transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "0",
                  marginLeft: "-2px",
                }}
              >
                <svg
                  viewBox="0 0 64 96"
                  width="16"
                  height="24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 5 C21 16 14 29 9.5 38 C7.5 42 9 46 13 46.5 C15.5 46.8 17 45.8 18.2 45 C20 52.5 25 58 32 58 C43 58 50.5 48 50.5 33 C50.5 22 48.5 12 46.5 5" />
                  <path d="M32 58 V86 M21 88 C26 86.5 38 86.5 43 88" />
                </svg>
                <span
                  style={{
                    fontWeight: "800",
                    fontSize: "18px",
                    letterSpacing: "-0.02em",
                  }}
                >
                  ANOSMIA
                </span>
              </button>
              <span
                className="f-mono"
                style={{ fontSize: "10.5px", color: "#5E4E49" }}
              >
                {v.jCountText}
              </span>
            </div>{" "}
            <div
              style={{
                height: "1.5px",
                background: "#1E1416",
                margin: "6px 0 14px",
              }}
            />{" "}
            <h1
              className="f-disp"
              style={{
                margin: "0 0 6px",
                fontSize: "46px",
                lineHeight: "0.92",
                fontWeight: "850",
                letterSpacing: "-0.03em",
              }}
            >
              The Cellar Book
            </h1>{" "}
            <p
              style={{ margin: "0 0 14px", fontSize: "14px", color: "#5E4E49" }}
            >
              What you actually noticed. Not what the back label said.
            </p>{" "}
            {v.resumeAB ? (
              <>
                {" "}
                <button
                  onClick={v.resume}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    width: "100%",
                    minHeight: "52px",
                    padding: "0 14px",
                    marginBottom: "12px",
                    borderRadius: "14px",
                    border: "1.5px solid #1E1416",
                    background: "#F2CF5B",
                    fontWeight: "650",
                    fontSize: "14px",
                    textAlign: "left",
                  }}
                >
                  <span>{v.resumeText}</span>
                  <span className="f-mono" style={{ fontSize: "10px" }}>
                    Resume
                  </span>
                </button>{" "}
              </>
            ) : null}{" "}
            <div
              role="tablist"
              aria-label="Journal sections"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                border: "1.5px solid #1E1416",
                borderRadius: "14px",
                overflow: "hidden",
                marginBottom: "16px",
              }}
            >
              <button
                role="tab"
                aria-selected={v.jTabTSel as AriaBool}
                onClick={v.setTabT}
                ref={css(v.tabTStyle)}
              >
                {"Tastings · "}
                {v.jN}
              </button>
              <button
                role="tab"
                aria-selected={v.jTabSSel as AriaBool}
                onClick={v.setTabS}
                ref={css(v.tabSStyle)}
              >
                {"A/B sessions · "}
                {v.sN}
              </button>
            </div>{" "}
            {v.jTabT ? (
              <>
                {" "}
                <section
                  aria-label="Your palate so far"
                  style={{
                    border: "1.5px solid #1E1416",
                    borderRadius: "16px",
                    background: "#FBF6EA",
                    padding: "14px 14px 12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                    }}
                  >
                    <span className="f-mono" style={{ fontSize: "10.5px" }}>
                      What you’ve reported
                    </span>
                    <span
                      className="f-mono"
                      style={{ fontSize: "9.5px", color: "#5E4E49" }}
                    >
                      Reported / tastings
                    </span>
                  </div>{" "}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "7px",
                      marginTop: "10px",
                    }}
                  >
                    {v.palate.map((p, i8) => (
                      <Fragment key={i8}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12.5px",
                              width: "98px",
                              flex: "none",
                            }}
                          >
                            {p.name}
                          </span>
                          <span
                            style={{
                              flex: "1",
                              display: "flex",
                              height: "10px",
                              borderRadius: "5px",
                              overflow: "hidden",
                              boxShadow: "inset 0 0 0 1px rgba(30,20,22,.18)",
                            }}
                          >
                            <span ref={css(p.segN)} />
                            <span ref={css(p.segZ)} />
                            <span ref={css(p.segU)} />
                            <span ref={css(p.segX)} />
                          </span>
                          <span
                            className="f-mono"
                            style={{
                              fontSize: "10px",
                              width: "26px",
                              textAlign: "right",
                              flex: "none",
                            }}
                          >
                            {p.count}
                          </span>
                        </div>
                      </Fragment>
                    ))}
                  </div>{" "}
                  <p
                    className="f-disp"
                    style={{
                      margin: "12px 0 0",
                      fontSize: "15.5px",
                      lineHeight: "1.3",
                      fontStyle: "italic",
                    }}
                  >
                    {v.ins1} {v.ins2}
                  </p>{" "}
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginTop: "10px",
                      fontSize: "11px",
                      color: "#5E4E49",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "2px",
                          background: "#5A1427",
                          display: "inline-block",
                        }}
                      />
                      Reported a level
                    </span>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "2px",
                          background: "#CDBFA6",
                          display: "inline-block",
                        }}
                      />
                      Not noticed
                    </span>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "2px",
                          display: "inline-block",
                          boxShadow: "inset 0 0 0 1px rgba(30,20,22,.5)",
                          backgroundImage:
                            "repeating-linear-gradient(135deg, rgba(30,20,22,.55) 0 1.5px, transparent 1.5px 4.5px)",
                        }}
                      />
                      Can’t tell
                    </span>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "2px",
                          display: "inline-block",
                          border: "1.5px dashed rgba(30,20,22,.4)",
                          boxSizing: "border-box",
                        }}
                      />
                      Unanswered
                    </span>
                  </div>{" "}
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: "11.5px",
                      color: "#5E4E49",
                      lineHeight: "1.4",
                    }}
                  >
                    Counts what you reported, nothing more. It doesn’t measure
                    accuracy, consistency or whether you could pick these wines
                    blind.
                  </p>
                </section>{" "}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "22px 12px",
                    marginTop: "22px",
                  }}
                >
                  {v.cards.map((c, i9) => (
                    <Fragment key={i9}>
                      <button
                        onClick={c.tap}
                        aria-label={c.aria}
                        aria-pressed={c.pressed as AriaBool}
                        ref={css(c.style)}
                      >
                        <span
                          style={{
                            position: "relative",
                            display: "block",
                            width: "100%",
                            aspectRatio: "4 / 5",
                            borderRadius: "10px",
                            overflow: "hidden",
                            border: "1.5px solid #1E1416",
                          }}
                        >
                          {" "}
                          {c.tile.hasPhoto ? (
                            <>
                              <span ref={css(c.tile.back)}>
                                <span ref={css(c.tile.card)}>
                                  <span ref={css(c.tile.prodStyle)}>
                                    {c.tile.prod}
                                  </span>
                                  <span ref={css(c.tile.titleStyle)}>
                                    {c.tile.title}
                                  </span>
                                  <span ref={css(c.tile.vinStyle)}>
                                    {c.tile.vin}
                                  </span>
                                </span>
                              </span>
                            </>
                          ) : null}{" "}
                          {c.tile.noPhoto ? (
                            <>
                              <span ref={css(c.tile.blankStyle)}>
                                <span ref={css(c.tile.blankTextStyle)}>
                                  {c.tile.blankText}
                                </span>
                                <span ref={css(c.tile.blankSubStyle)}>
                                  {c.tile.blankSub}
                                </span>
                              </span>
                            </>
                          ) : null}{" "}
                          {c.isNew ? (
                            <>
                              <span
                                className="f-mono"
                                style={{
                                  position: "absolute",
                                  left: "8px",
                                  top: "8px",
                                  background: "#F2CF5B",
                                  border: "1.5px solid #1E1416",
                                  borderRadius: "6px",
                                  padding: "3px 6px",
                                  fontSize: "9.5px",
                                }}
                              >
                                Just now
                              </span>
                            </>
                          ) : null}{" "}
                          {c.selecting ? (
                            <>
                              <span ref={css(c.checkStyle)}>{c.checkText}</span>
                            </>
                          ) : null}{" "}
                        </span>{" "}
                        <span
                          className="f-mono"
                          style={{
                            display: "block",
                            fontSize: "9.5px",
                            marginTop: "9px",
                            color: "#5E4E49",
                          }}
                        >
                          {c.date}
                        </span>{" "}
                        <span
                          className="f-disp"
                          style={{
                            display: "block",
                            fontSize: "17px",
                            fontWeight: "700",
                            lineHeight: "1.1",
                            marginTop: "3px",
                          }}
                        >
                          {c.title}
                        </span>{" "}
                        <span
                          style={{
                            display: "block",
                            fontSize: "12px",
                            color: "#5E4E49",
                            marginTop: "1px",
                          }}
                        >
                          {c.sub}
                        </span>{" "}
                        <span
                          style={{
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "space-between",
                            marginTop: "8px",
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              display: "flex",
                              alignItems: "flex-end",
                              gap: "3px",
                              height: "44px",
                            }}
                          >
                            {c.fp.map((b, i10) => (
                              <Fragment key={i10}>
                                <span ref={css(b.style)} />
                              </Fragment>
                            ))}
                          </span>
                          <span
                            className="f-mono"
                            style={{
                              fontSize: "9.5px",
                              textAlign: "right",
                              maxWidth: "70px",
                              lineHeight: "1.3",
                            }}
                          >
                            {c.enjoy}
                          </span>
                        </span>{" "}
                        <span
                          className="f-disp"
                          style={{
                            display: "block",
                            fontStyle: "italic",
                            fontSize: "15px",
                            marginTop: "7px",
                            lineHeight: "1.22",
                          }}
                        >
                          {c.note}
                        </span>
                      </button>
                    </Fragment>
                  ))}
                </div>{" "}
                {v.isDemo ? (
                  <p
                    className="f-mono"
                    style={{
                      fontSize: "9.5px",
                      color: "#7A6A64",
                      margin: "22px 0 0",
                      lineHeight: "1.6",
                    }}
                  >
                    Sample entries and ratings are illustrative.
                  </p>
                ) : null}{" "}
              </>
            ) : null}{" "}
            {v.jTabS ? (
              <>
                {" "}
                <section
                  aria-label="Differences you have reported"
                  style={{
                    border: "1.5px solid #1E1416",
                    borderRadius: "16px",
                    background: "#FBF6EA",
                    padding: "14px 14px 12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                    }}
                  >
                    <span className="f-mono" style={{ fontSize: "10.5px" }}>
                      Differences you’ve reported
                    </span>
                    <span
                      className="f-mono"
                      style={{ fontSize: "9.5px", color: "#5E4E49" }}
                    >
                      A or B / sessions
                    </span>
                  </div>{" "}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "7px",
                      marginTop: "10px",
                    }}
                  >
                    {v.sessPal.map((p, i11) => (
                      <Fragment key={i11}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12.5px",
                              width: "98px",
                              flex: "none",
                            }}
                          >
                            {p.name}
                          </span>
                          <span
                            style={{
                              flex: "1",
                              display: "flex",
                              height: "10px",
                              borderRadius: "5px",
                              overflow: "hidden",
                              boxShadow: "inset 0 0 0 1px rgba(30,20,22,.18)",
                            }}
                          >
                            <span ref={css(p.segD)} />
                            <span ref={css(p.segS)} />
                            <span ref={css(p.segU)} />
                            <span ref={css(p.segX)} />
                          </span>
                          <span
                            className="f-mono"
                            style={{
                              fontSize: "10px",
                              width: "26px",
                              textAlign: "right",
                              flex: "none",
                            }}
                          >
                            {p.count}
                          </span>
                        </div>
                      </Fragment>
                    ))}
                  </div>{" "}
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginTop: "10px",
                      fontSize: "11px",
                      color: "#5E4E49",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "2px",
                          background: "#5A1427",
                          display: "inline-block",
                        }}
                      />
                      A or B
                    </span>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "2px",
                          background: "#CDBFA6",
                          display: "inline-block",
                        }}
                      />
                      About the same
                    </span>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "2px",
                          display: "inline-block",
                          boxShadow: "inset 0 0 0 1px rgba(30,20,22,.5)",
                          backgroundImage:
                            "repeating-linear-gradient(135deg, rgba(30,20,22,.55) 0 1.5px, transparent 1.5px 4.5px)",
                        }}
                      />
                      Can’t tell
                    </span>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "2px",
                          display: "inline-block",
                          border: "1.5px dashed rgba(30,20,22,.4)",
                          boxSizing: "border-box",
                        }}
                      />
                      Unanswered
                    </span>
                  </div>{" "}
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: "11.5px",
                      color: "#5E4E49",
                      lineHeight: "1.4",
                    }}
                  >
                    Counts how often you reported a difference, nothing more.
                    Whether you could tell unfamiliar wines apart blind is a
                    different exercise for another day.
                  </p>
                </section>{" "}
                <div
                  style={{
                    marginTop: "14px",
                    borderTop: "1.5px solid #1E1416",
                  }}
                >
                  {v.sessCards.map((c, i12) => (
                    <Fragment key={i12}>
                      {" "}
                      <button
                        onClick={c.tap}
                        aria-label={c.aria}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          width: "100%",
                          padding: "14px 2px",
                          boxSizing: "border-box",
                          border: "0",
                          borderBottom: "1px solid rgba(30,20,22,.2)",
                          background: "transparent",
                          textAlign: "left",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            gap: "12px",
                            alignItems: "center",
                            width: "100%",
                          }}
                        >
                          <span
                            style={{
                              flex: "1",
                              minWidth: "0",
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                            }}
                          >
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                minWidth: "0",
                              }}
                            >
                              <span ref={css(c.aMark)}>A</span>
                              <span
                                className="f-disp"
                                style={{
                                  fontSize: "16px",
                                  fontWeight: "700",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {c.aName}
                              </span>
                            </span>
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                minWidth: "0",
                              }}
                            >
                              <span ref={css(c.bMark)}>B</span>
                              <span
                                className="f-disp"
                                style={{
                                  fontSize: "16px",
                                  fontWeight: "700",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {c.bName}
                              </span>
                            </span>
                          </span>
                          <span
                            aria-hidden="true"
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                              flex: "none",
                              padding: "6px 8px",
                              border: "1px solid rgba(30,20,22,.25)",
                              borderRadius: "8px",
                              background: "#FBF6EA",
                            }}
                          >
                            {c.mini.map((m, i13) => (
                              <Fragment key={i13}>
                                <span
                                  ref={css(
                                    `display: flex; align-items: center; width: 52px; height: 6px; position: relative; ${m.tS}`,
                                  )}
                                >
                                  <span
                                    style={{
                                      flex: "1",
                                      display: "flex",
                                      justifyContent: "flex-end",
                                    }}
                                  >
                                    <span ref={css(m.aS)} />
                                  </span>
                                  <span
                                    style={{
                                      width: "1px",
                                      height: "8px",
                                      background: "#1E1416",
                                      flex: "none",
                                    }}
                                  />
                                  <span style={{ flex: "1", display: "flex" }}>
                                    <span ref={css(m.bS)} />
                                  </span>
                                  <span ref={css(m.mS)} />
                                </span>
                              </Fragment>
                            ))}
                          </span>
                        </span>
                        <span
                          className="f-mono"
                          style={{ fontSize: "9.5px", color: "#5E4E49" }}
                        >
                          {c.meta}
                        </span>
                      </button>{" "}
                    </Fragment>
                  ))}
                </div>{" "}
                {v.noSessions ? (
                  <>
                    <p style={{ margin: "14px 0 0", fontSize: "14px" }}>
                      No A/B sessions yet. Two glasses, one mouth, whenever you
                      like.
                    </p>
                  </>
                ) : null}{" "}
                <p
                  className="f-mono"
                  style={{
                    fontSize: "9.5px",
                    color: "#7A6A64",
                    margin: "18px 0 0",
                    lineHeight: "1.6",
                  }}
                >
                  The sample session is illustrative.
                </p>{" "}
              </>
            ) : null}
          </div>
          <div
            style={{
              position: "absolute",
              left: "0",
              right: "0",
              bottom: "0",
              padding:
                "12px 16px calc(18px + env(safe-area-inset-bottom, 0px))",
              background: "#F5ECD7",
              borderTop: "1.5px solid #1E1416",
            }}
          >
            {v.notSelecting ? (
              <>
                {" "}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.4fr",
                    gap: "10px",
                  }}
                >
                  <button
                    className="press"
                    onClick={v.openChooser}
                    style={{
                      height: "60px",
                      borderRadius: "18px",
                      border: "1.5px solid #1E1416",
                      background: "#FBF6EA",
                      fontWeight: "650",
                      fontSize: "15px",
                    }}
                  >
                    Compare
                  </button>
                  <button
                    className="press"
                    onClick={v.start}
                    style={{
                      height: "60px",
                      borderRadius: "18px",
                      border: "1.5px solid #1E1416",
                      background: "#F2CF5B",
                      fontWeight: "700",
                      fontSize: "16px",
                    }}
                  >
                    New tasting
                  </button>
                </div>{" "}
              </>
            ) : null}{" "}
            {v.selecting ? (
              <>
                {" "}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "0.8fr 1.4fr",
                    gap: "10px",
                  }}
                >
                  <button
                    onClick={v.cancelSelect}
                    style={{
                      height: "60px",
                      borderRadius: "18px",
                      border: "1.5px solid #1E1416",
                      background: "transparent",
                      fontWeight: "600",
                      fontSize: "15px",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="press"
                    onClick={v.doCompare}
                    disabled={v.cmpDisabled}
                    ref={css(v.cmpBtnStyle)}
                  >
                    <span>Compare</span>
                    <span
                      className="f-mono"
                      style={{ fontSize: "10px", fontWeight: "400" }}
                    >
                      {v.selText}
                    </span>
                  </button>
                </div>{" "}
              </>
            ) : null}
          </div>
        </>
      ) : null}
      {/* 5b · JOURNAL ENTRY (blind by default) */}
      {v.isEntry ? (
        <>
          <div
            className="fade scroll"
            style={{
              position: "absolute",
              inset: "0 0 calc(96px + env(safe-area-inset-bottom, 0px)) 0",
              overflowY: "auto",
              padding: "8px 16px 26px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                height: "44px",
              }}
            >
              <button
                onClick={v.goJournal}
                style={{
                  height: "44px",
                  border: "0",
                  background: "transparent",
                  marginLeft: "-8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 5l-7 7 7 7" />
                </svg>
                Journal
              </button>
              <span
                className="f-mono"
                style={{ fontSize: "10.5px", color: "#5E4E49" }}
              >
                {v.ent.date}
              </span>
            </div>{" "}
            <div ref={css(v.entFrameStyle)}>
              {v.ent.tile.hasPhoto ? (
                <>
                  <div ref={css(v.ent.tile.back)}>
                    <div ref={css(v.ent.tile.card)}>
                      <span ref={css(v.ent.tile.prodStyle)}>
                        {v.ent.tile.prod}
                      </span>
                      <span ref={css(v.ent.tile.titleStyle)}>
                        {v.ent.tile.title}
                      </span>
                      <span ref={css(v.ent.tile.vinStyle)}>
                        {v.ent.tile.vin}
                      </span>
                    </div>
                  </div>
                </>
              ) : null}{" "}
              {v.ent.tile.noPhoto ? (
                <>
                  <div ref={css(v.ent.tile.blankStyle)}>
                    <span ref={css(v.ent.tile.blankTextStyle)}>
                      {v.ent.tile.blankText}
                    </span>
                    <span ref={css(v.ent.tile.blankSubStyle)}>
                      {v.ent.tile.blankSub}
                    </span>
                  </div>
                </>
              ) : null}
              {v.entPhotoEdit ? (
                <button
                  onClick={v.entPhotoOpen}
                  style={{
                    position: "absolute",
                    inset: "0",
                    border: "0",
                    padding: "12px",
                    background: "transparent",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "flex-end",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      height: "44px",
                      padding: "0 16px",
                      borderRadius: "22px",
                      border: "1.5px solid #1E1416",
                      background: "#FBF6EA",
                      fontWeight: "650",
                      fontSize: "14px",
                      color: "#1E1416",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    >
                      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                      <circle cx="12" cy="13" r="3.5" />
                    </svg>
                    {v.entPhotoLabel}
                  </span>
                </button>
              ) : null}
            </div>{" "}
            <WithEdit on={v.entEdit} onEdit={v.entEditWine}>
              <h1
                className="f-disp"
                style={{
                  margin: "16px 0 3px",
                  fontSize: "32px",
                  lineHeight: "1",
                  fontWeight: "800",
                  letterSpacing: "-0.02em",
                }}
              >
                {v.ent.title}
              </h1>{" "}
              <div style={{ fontSize: "13.5px", color: "#5E4E49" }}>
                {v.ent.sub}
              </div>
            </WithEdit>{" "}
            {v.ent.hasNotes ? (
              <>
                {" "}
                <blockquote
                  className="f-disp"
                  style={{
                    margin: "18px 0 0",
                    padding: "14px 0",
                    borderTop: "1.5px solid #1E1416",
                    borderBottom: "1.5px solid #1E1416",
                    fontSize: "34px",
                    lineHeight: "1.04",
                    fontStyle: "italic",
                    fontWeight: "500",
                    color: "#5A1427",
                  }}
                >
                  “{v.ent.notes}”
                </blockquote>{" "}
              </>
            ) : null}{" "}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "12px",
              }}
            >
              <span
                className="f-mono"
                style={{ fontSize: "10.5px", color: "#5E4E49" }}
              >
                Would pour another
              </span>
              <span style={{ fontWeight: "650" }}>{v.ent.enjoy}</span>
            </div>{" "}
            {v.ent.hidden ? (
              <>
                {" "}
                <div
                  style={{
                    marginTop: "18px",
                    border: "1.5px dashed #1E1416",
                    borderRadius: "16px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <h2
                    className="f-disp"
                    style={{ margin: "0", fontSize: "20px", fontWeight: "750" }}
                  >
                    Your sensations are hidden.
                  </h2>
                  <p
                    style={{
                      margin: "0",
                      fontSize: "13.5px",
                      color: "#3E302D",
                    }}
                  >
                    So you can taste it again without peeking at last time.
                    Reveal them whenever you like.
                  </p>
                  <button
                    onClick={v.toggleReveal}
                    style={{
                      alignSelf: "flex-start",
                      marginTop: "6px",
                      height: "44px",
                      padding: "0 16px",
                      borderRadius: "22px",
                      border: "1.5px solid #1E1416",
                      background: "transparent",
                      fontWeight: "600",
                      fontSize: "14px",
                    }}
                  >
                    Reveal what I noticed
                  </button>
                </div>{" "}
              </>
            ) : null}{" "}
            {v.ent.shown ? (
              <>
                {" "}
                <div className="fade" style={{ marginTop: "18px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      borderBottom: "1.5px solid #1E1416",
                      paddingBottom: "6px",
                    }}
                  >
                    <h2
                      className="f-disp"
                      style={{
                        margin: "0",
                        fontSize: "20px",
                        fontWeight: "750",
                      }}
                    >
                      What you noticed
                    </h2>
                    <button
                      onClick={v.toggleReveal}
                      style={{
                        height: "36px",
                        border: "0",
                        background: "transparent",
                        fontWeight: "600",
                        fontSize: "13px",
                        textDecoration: "underline",
                      }}
                    >
                      Hide again
                    </button>
                  </div>{" "}
                  {v.ent.rows.map((r, i14) => (
                    <Fragment key={i14}>
                      {" "}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          minHeight: "44px",
                          borderBottom: "1px solid rgba(30,20,22,.2)",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "600",
                            fontSize: "14.5px",
                            width: "130px",
                            flex: "none",
                          }}
                        >
                          {r.name}
                        </span>
                        <span style={{ display: "flex", gap: "3px" }}>
                          {r.cells.map((c, i15) => (
                            <Fragment key={i15}>
                              <span ref={css(c.style)} />
                            </Fragment>
                          ))}
                        </span>
                        <span ref={css(r.valStyle)}>{r.val}</span>
                      </div>{" "}
                    </Fragment>
                  ))}
                </div>{" "}
              </>
            ) : null}
          </div>
          <div
            style={{
              position: "absolute",
              left: "0",
              right: "0",
              bottom: "0",
              padding:
                "12px 16px calc(18px + env(safe-area-inset-bottom, 0px))",
              background: "#F5ECD7",
              borderTop: "1.5px solid #1E1416",
              display: "grid",
              gridTemplateColumns: "1fr 1.7fr",
              gap: "10px",
            }}
          >
            <button
              className="press"
              onClick={v.compareFromEntry}
              style={{
                height: "60px",
                borderRadius: "18px",
                border: "1.5px solid #1E1416",
                background: "#FBF6EA",
                fontWeight: "650",
                fontSize: "15px",
              }}
            >
              Compare
            </button>
            <button
              className="press"
              onClick={v.tasteAgain}
              style={{
                height: "60px",
                borderRadius: "18px",
                border: "1.5px solid #1E1416",
                background: "#F2CF5B",
                fontWeight: "700",
                fontSize: "15.5px",
                lineHeight: "1.1",
              }}
            >
              Taste it again, blind
            </button>
          </div>
        </>
      ) : null}
      {/* 6 · COMPARE */}
      {v.isCompare ? (
        <>
          <div
            className="fade scroll"
            style={{
              position: "absolute",
              inset: "0 0 calc(96px + env(safe-area-inset-bottom, 0px)) 0",
              overflowY: "auto",
              padding: "8px 16px 26px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                height: "44px",
              }}
            >
              <button
                onClick={v.goJournal}
                style={{
                  height: "44px",
                  border: "0",
                  background: "transparent",
                  marginLeft: "-8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 5l-7 7 7 7" />
                </svg>
                Journal
              </button>
              <span
                className="f-mono"
                style={{ fontSize: "10.5px", color: "#5E4E49" }}
              >
                Compare · your impressions
              </span>
            </div>{" "}
            <h1
              className="f-disp"
              style={{
                margin: "6px 0 14px",
                fontSize: "38px",
                lineHeight: "0.95",
                fontWeight: "850",
                letterSpacing: "-0.025em",
              }}
            >
              Two glasses, one mouth.
            </h1>{" "}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "12px",
              }}
            >
              {v.cmpHeads.map((h, i16) => (
                <Fragment key={i16}>
                  <div ref={css(h.boxStyle)}>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "flex-end",
                      }}
                    >
                      <span
                        style={{
                          width: "54px",
                          height: "68px",
                          borderRadius: "7px",
                          overflow: "hidden",
                          flex: "none",
                          display: "block",
                          border: "1px solid #1E1416",
                        }}
                      >
                        {" "}
                        {h.tile.hasPhoto ? (
                          <>
                            <span ref={css(h.tile.back)}>
                              <span ref={css(h.tile.card)}>
                                <span ref={css(h.tile.prodStyle)}>
                                  {h.tile.prod}
                                </span>
                                <span ref={css(h.tile.titleStyle)}>
                                  {h.tile.title}
                                </span>
                                <span ref={css(h.tile.vinStyle)}>
                                  {h.tile.vin}
                                </span>
                              </span>
                            </span>
                          </>
                        ) : null}{" "}
                        {h.tile.noPhoto ? (
                          <>
                            <span ref={css(h.tile.blankStyle)}>
                              <span ref={css(h.tile.blankTextStyle)}>
                                {h.tile.blankText}
                              </span>
                              <span ref={css(h.tile.blankSubStyle)}>
                                {h.tile.blankSub}
                              </span>
                            </span>
                          </>
                        ) : null}{" "}
                      </span>
                      <span
                        aria-hidden="true"
                        style={{
                          display: "flex",
                          alignItems: "flex-end",
                          gap: "2px",
                          height: "40px",
                        }}
                      >
                        {h.fp.map((b, i17) => (
                          <Fragment key={i17}>
                            <span ref={css(b.style)} />
                          </Fragment>
                        ))}
                      </span>
                    </div>{" "}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginTop: "10px",
                      }}
                    >
                      <span ref={css(h.key)}>{h.side}</span>
                      <span className="f-mono" style={{ fontSize: "9.5px" }}>
                        {h.date}
                      </span>
                    </div>{" "}
                    <div
                      className="f-disp"
                      style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        lineHeight: "1.1",
                        marginTop: "3px",
                      }}
                    >
                      {h.title}
                    </div>{" "}
                    <div style={{ fontSize: "11.5px", color: "#5E4E49" }}>
                      {h.sub}
                    </div>{" "}
                    <div style={{ fontSize: "11.5px", marginTop: "4px" }}>
                      <span
                        className="f-mono"
                        style={{ fontSize: "9px", color: "#5E4E49" }}
                      >
                        {"Pour another: "}
                      </span>
                      <b>{h.enjoy}</b>
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>{" "}
            <div
              style={{ marginTop: "22px", borderTop: "1.5px solid #1E1416" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) 84px minmax(0, 1fr)",
                  alignItems: "center",
                  height: "30px",
                }}
                className="f-mono"
              >
                <span
                  style={{
                    fontSize: "9.5px",
                    textAlign: "right",
                    color: "#5A1427",
                  }}
                >
                  ◂ A
                </span>
                <span />
                <span style={{ fontSize: "9.5px", color: "#8A5608" }}>B ▸</span>
              </div>{" "}
              {v.cmpRows.map((r, i18) => (
                <Fragment key={i18}>
                  {" "}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) 84px minmax(0, 1fr)",
                      alignItems: "center",
                      minHeight: "44px",
                      borderBottom: "1px solid rgba(30,20,22,.18)",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        className="f-mono"
                        style={{
                          fontSize: "10.5px",
                          width: "12px",
                          textAlign: "center",
                        }}
                      >
                        {r.aNum}
                      </span>
                      <span style={{ display: "flex", gap: "3px" }}>
                        {r.aCells.map((c, i19) => (
                          <Fragment key={i19}>
                            <span ref={css(c.style)} />
                          </Fragment>
                        ))}
                      </span>
                    </span>
                    <span
                      style={{
                        fontSize: "12.5px",
                        fontWeight: "650",
                        textAlign: "center",
                      }}
                    >
                      {r.name}
                    </span>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span style={{ display: "flex", gap: "3px" }}>
                        {r.bCells.map((c, i20) => (
                          <Fragment key={i20}>
                            <span ref={css(c.style)} />
                          </Fragment>
                        ))}
                      </span>
                      <span
                        className="f-mono"
                        style={{
                          fontSize: "10.5px",
                          width: "12px",
                          textAlign: "center",
                        }}
                      >
                        {r.bNum}
                      </span>
                    </span>
                  </div>{" "}
                </Fragment>
              ))}{" "}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px 14px",
                  marginTop: "10px",
                  fontSize: "11px",
                  color: "#5E4E49",
                }}
              >
                <span>1–4 = your level</span>
                <span>0 = not noticed</span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <span
                    style={{
                      width: "14px",
                      height: "10px",
                      borderRadius: "2px",
                      display: "inline-block",
                      boxShadow: "inset 0 0 0 1px rgba(30,20,22,.45)",
                      backgroundImage:
                        "repeating-linear-gradient(135deg, rgba(30,20,22,.45) 0 1.5px, transparent 1.5px 5px)",
                    }}
                  />
                  ? can’t tell
                </span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <span
                    style={{
                      width: "14px",
                      height: "10px",
                      borderRadius: "2px",
                      display: "inline-block",
                      border: "1.5px dashed rgba(30,20,22,.4)",
                      boxSizing: "border-box",
                    }}
                  />
                  – unanswered
                </span>
              </div>
            </div>{" "}
            <h2
              className="f-disp"
              style={{
                margin: "24px 0 8px",
                fontSize: "22px",
                fontWeight: "750",
              }}
            >
              What stands out
            </h2>{" "}
            <ul
              style={{
                margin: "0",
                padding: "0",
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {v.standOut.map((s, i21) => (
                <Fragment key={i21}>
                  <li
                    style={{
                      display: "flex",
                      gap: "10px",
                      fontSize: "14.5px",
                      lineHeight: "1.4",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#1E1416",
                        flex: "none",
                        marginTop: "7px",
                      }}
                    />
                    <span>{s.t}</span>
                  </li>
                </Fragment>
              ))}
            </ul>{" "}
            <p
              style={{
                margin: "18px 0 0",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "#EADFC6",
                fontSize: "12.5px",
                lineHeight: "1.45",
                color: "#3E302D",
              }}
            >
              These are your own impressions from two different moments: not
              measurements, and not the winemaker’s notes. Published
              characteristics live with the bottle in the shop, never in this
              chart.
            </p>{" "}
            <button
              onClick={v.tasteSideBySide}
              style={{
                marginTop: "12px",
                width: "100%",
                height: "52px",
                borderRadius: "16px",
                border: "1.5px solid #1E1416",
                background: "transparent",
                fontWeight: "650",
                fontSize: "14.5px",
              }}
            >
              Taste these two side by side, A vs B
            </button>
          </div>
          <div
            style={{
              position: "absolute",
              left: "0",
              right: "0",
              bottom: "0",
              padding:
                "12px 16px calc(18px + env(safe-area-inset-bottom, 0px))",
              background: "#F5ECD7",
              borderTop: "1.5px solid #1E1416",
              display: "grid",
              gridTemplateColumns: "1fr 1.6fr",
              gap: "10px",
            }}
          >
            <button
              className="press"
              onClick={v.swapCmp}
              style={{
                height: "60px",
                borderRadius: "18px",
                border: "1.5px solid #1E1416",
                background: "#FBF6EA",
                fontWeight: "650",
                fontSize: "15px",
              }}
            >
              Swap sides
            </button>
            <button
              className="press"
              onClick={v.startSelect}
              style={{
                height: "60px",
                borderRadius: "18px",
                border: "1.5px solid #1E1416",
                background: "#F2CF5B",
                fontWeight: "700",
                fontSize: "15.5px",
              }}
            >
              Pick other wines
            </button>
          </div>
        </>
      ) : null}
      {/* B1 · A/B SETUP */}
      {v.isAbSetup ? (
        <>
          <div
            className="fade scroll"
            style={{
              position: "absolute",
              inset: "0 0 calc(104px + env(safe-area-inset-bottom, 0px)) 0",
              overflowY: "auto",
              padding: "8px 16px 24px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                height: "44px",
              }}
            >
              <button
                aria-label="Back"
                onClick={v.abSetupBack}
                style={{
                  width: "44px",
                  height: "44px",
                  border: "0",
                  background: "transparent",
                  marginLeft: "-12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <span
                className="f-mono"
                style={{ fontSize: "10.5px", color: "#5E4E49" }}
              >
                A vs B · Setup · All optional
              </span>
            </div>{" "}
            <h1
              className="f-disp"
              style={{
                margin: "6px 0 6px",
                fontSize: "40px",
                lineHeight: "0.95",
                fontWeight: "850",
                letterSpacing: "-0.025em",
              }}
            >
              Two glasses. One mouth.
            </h1>{" "}
            <p
              style={{
                margin: "0 0 16px",
                fontSize: "14.5px",
                color: "#3E302D",
              }}
            >
              Pour a little of each. Call them A and B. We’ll see what you
              notice.
            </p>{" "}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "10px",
              }}
            >
              {v.abSlots.map((sl, i22) => (
                <Fragment key={i22}>
                  <button
                    onClick={sl.tap}
                    aria-label={sl.aria}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "6px",
                      padding: "14px 12px",
                      minHeight: "150px",
                      boxSizing: "border-box",
                      border: "1.5px solid #1E1416",
                      borderRadius: "16px",
                      background: "#FBF6EA",
                      textAlign: "left",
                    }}
                  >
                    <span ref={css(sl.mark)}>{sl.letter}</span>
                    <span
                      className="f-mono"
                      style={{
                        fontSize: "10px",
                        color: "#5E4E49",
                        marginTop: "4px",
                      }}
                    >
                      {sl.side}
                    </span>
                    <span
                      className="f-disp"
                      style={{
                        fontSize: "17px",
                        fontWeight: "700",
                        lineHeight: "1.1",
                      }}
                    >
                      {sl.name}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#5E4E49",
                        marginTop: "auto",
                      }}
                    >
                      {sl.sub}
                    </span>
                  </button>
                </Fragment>
              ))}
            </div>{" "}
            <div
              style={{
                marginTop: "16px",
                borderTop: "1.5px solid #1E1416",
                paddingTop: "12px",
                display: "flex",
                gap: "12px",
                alignItems: "center",
              }}
            >
              {v.abGlassPhoto ? (
                <>
                  <svg
                    viewBox="0 0 84 60"
                    width="84"
                    height="60"
                    role="img"
                    aria-label="Photo of both glasses, A on the left, B on the right"
                    style={{
                      flex: "none",
                      borderRadius: "8px",
                      background: "#2B2522",
                    }}
                  >
                    <path
                      d="M14 10h18c0 14-4 20-9 20s-9-6-9-20z M23 30v18 M16 50h14"
                      fill="none"
                      stroke="#EADFC6"
                      strokeWidth="2"
                    />
                    <path
                      d="M15 18h16c-1 9-4 12-8 12s-7-3-8-12z"
                      fill="#7E1F35"
                    />
                    <path
                      d="M52 10h18c0 14-4 20-9 20s-9-6-9-20z M61 30v18 M54 50h14"
                      fill="none"
                      stroke="#EADFC6"
                      strokeWidth="2"
                    />
                    <path
                      d="M53 18h16c-1 9-4 12-8 12s-7-3-8-12z"
                      fill="#7E1F35"
                    />
                    <circle cx="23" cy="40" r="5" fill="#FBF6EA" />
                    <text
                      x="23"
                      y="43"
                      fontSize="7"
                      textAnchor="middle"
                      fill="#5A1427"
                      fontWeight="700"
                    >
                      A
                    </text>
                    <rect x="56" y="35" width="10" height="10" fill="#FBF6EA" />
                    <text
                      x="61"
                      y="43"
                      fontSize="7"
                      textAnchor="middle"
                      fill="#8A5608"
                      fontWeight="700"
                    >
                      B
                    </text>
                  </svg>
                </>
              ) : null}
              <div style={{ flex: "1", minWidth: "0" }}>
                <div style={{ fontWeight: "650", fontSize: "14px" }}>
                  Keep A on your left, B on your right.
                </div>{" "}
                <div style={{ fontSize: "12.5px", color: "#5E4E49" }}>
                  Or stick a note on each. The screen keeps the same sides.
                </div>
              </div>
            </div>{" "}
            <button
              onClick={v.toggleGlassPhoto}
              style={{
                marginTop: "8px",
                height: "44px",
                padding: "0 14px",
                borderRadius: "22px",
                border: "1.5px solid #1E1416",
                background: "transparent",
                fontWeight: "600",
                fontSize: "13.5px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              >
                <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              {v.abGlassPhotoLabel}
            </button>{" "}
            <h2
              className="f-mono"
              style={{
                margin: "22px 0 8px",
                fontSize: "10.5px",
                fontWeight: "500",
              }}
            >
              Who poured?
            </h2>{" "}
            <div
              role="group"
              aria-label="Who poured"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "8px",
              }}
            >
              <button
                onClick={v.setOpen}
                aria-pressed={v.abOpenPressed as AriaBool}
                ref={css(v.abOpenStyle)}
              >
                I did
                <span style={{ fontWeight: "400", fontSize: "12px" }}>
                  I know which is which
                </span>
              </button>
              <button
                onClick={v.setBlind}
                aria-pressed={v.abBlindPressed as AriaBool}
                ref={css(v.abBlindStyle)}
              >
                Someone else
                <span style={{ fontWeight: "400", fontSize: "12px" }}>
                  Blind: I don’t know
                </span>
              </button>
            </div>{" "}
            <p
              style={{
                margin: "8px 0 0",
                fontSize: "12.5px",
                color: "#5E4E49",
                lineHeight: "1.45",
              }}
            >
              {v.abModeNote}
            </p>
          </div>
          <div
            style={{
              position: "absolute",
              left: "0",
              right: "0",
              bottom: "0",
              padding:
                "12px 16px calc(18px + env(safe-area-inset-bottom, 0px))",
              background: "#F5ECD7",
              borderTop: "1.5px solid #1E1416",
            }}
          >
            <button
              className="press"
              onClick={v.abBegin}
              style={{
                width: "100%",
                height: "62px",
                borderRadius: "18px",
                border: "1.5px solid #1E1416",
                background: "#F2CF5B",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 20px",
                textAlign: "left",
              }}
            >
              <span style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontWeight: "700",
                    fontSize: "17px",
                    lineHeight: "1.15",
                  }}
                >
                  Start comparing
                </span>
                <span style={{ fontSize: "12.5px", color: "#3E302D" }}>
                  Names can wait until after.
                </span>
              </span>
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12h15M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </>
      ) : null}
      {/* B2 · A/B RECORD (upper half; answers live in the A/B dock) */}
      {v.isAbRecord ? (
        <>
          <div
            className="fade scroll"
            style={{
              position: "absolute",
              inset: "0 0 calc(348px + env(safe-area-inset-bottom, 0px)) 0",
              overflowY: "auto",
              padding: "8px 16px 14px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                height: "44px",
              }}
            >
              <button
                aria-label="Back to setup"
                onClick={v.abToSetup}
                style={{
                  width: "44px",
                  height: "44px",
                  border: "0",
                  background: "transparent",
                  marginLeft: "-12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <span
                className="f-mono"
                style={{ fontSize: "10.5px", color: "#5E4E49" }}
              >
                {"A vs B · "}
                {v.abAnsweredText}
              </span>
            </div>{" "}
            <h1
              className="f-disp"
              style={{
                margin: "0 0 2px",
                fontSize: "30px",
                lineHeight: "1",
                fontWeight: "800",
                letterSpacing: "-0.02em",
              }}
            >
              Which way does it lean?
            </h1>{" "}
            <p
              style={{
                margin: "0 0 10px",
                fontSize: "13.5px",
                color: "#5E4E49",
              }}
            >
              Sip A, sip B, tap what you notice. Back and forth as often as you
              like.
            </p>{" "}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "8px",
                marginBottom: "10px",
              }}
            >
              {v.abStrip.map((g, i23) => (
                <Fragment key={i23}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      minWidth: "0",
                      padding: "6px 8px",
                      border: "1.5px solid #1E1416",
                      borderRadius: "12px",
                      background: "#FBF6EA",
                    }}
                  >
                    <span ref={css(g.mark)}>{g.letter}</span>
                    <span
                      style={{
                        fontSize: "12.5px",
                        fontWeight: "600",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {g.name}
                    </span>
                  </div>
                </Fragment>
              ))}
            </div>{" "}
            <div style={{ borderTop: "1.5px solid #1E1416" }}>
              {v.abRows.map((r, i24) => (
                <Fragment key={i24}>
                  {" "}
                  <button
                    onClick={r.tap}
                    aria-label={r.aria}
                    data-active={r.activeAttr}
                    ref={css(r.rowStyle)}
                  >
                    <span
                      style={{
                        fontWeight: "650",
                        fontSize: "14px",
                        width: "74px",
                        flex: "none",
                        textAlign: "left",
                      }}
                    >
                      {r.name}
                    </span>{" "}
                    <span aria-hidden="true" ref={css(r.track)}>
                      <span
                        style={{
                          flex: "1",
                          display: "flex",
                          justifyContent: "flex-end",
                          alignItems: "center",
                        }}
                      >
                        <span ref={css(r.aBar)}>{r.aTxt}</span>
                      </span>
                      <span ref={css(r.axis)} />
                      <span
                        style={{
                          flex: "1",
                          display: "flex",
                          justifyContent: "flex-start",
                          alignItems: "center",
                        }}
                      >
                        <span ref={css(r.bBar)}>{r.bTxt}</span>
                      </span>
                      <span ref={css(r.mid)}>{r.midText}</span>
                    </span>{" "}
                    <span ref={css(r.labelStyle)}>{r.label}</span>
                  </button>{" "}
                </Fragment>
              ))}
            </div>
          </div>
        </>
      ) : null}
      {/* B3 · A/B REVIEW */}
      {v.isAbReview ? (
        <>
          <div
            className="fade scroll"
            style={{
              position: "absolute",
              inset: "0 0 calc(112px + env(safe-area-inset-bottom, 0px)) 0",
              overflowY: "auto",
              padding: "8px 16px 26px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                height: "44px",
              }}
            >
              <button
                onClick={v.abKeepGoing}
                style={{
                  height: "44px",
                  border: "0",
                  background: "transparent",
                  marginLeft: "-8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 5l-7 7 7 7" />
                </svg>
                Keep comparing
              </button>
              <span
                className="f-mono"
                style={{ fontSize: "10.5px", color: "#5E4E49" }}
              >
                {v.abReviewTag}
              </span>
            </div>{" "}
            <h1
              className="f-disp"
              style={{
                margin: "4px 0 12px",
                fontSize: "32px",
                lineHeight: "0.98",
                fontWeight: "850",
                letterSpacing: "-0.02em",
              }}
            >
              What your mouth said.
            </h1>{" "}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "8px",
              }}
            >
              {v.abStrip.map((g, i25) => (
                <Fragment key={i25}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      minWidth: "0",
                      padding: "10px",
                      border: "1.5px solid #1E1416",
                      borderRadius: "12px",
                      background: "#FBF6EA",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        minWidth: "0",
                      }}
                    >
                      <span ref={css(g.mark)}>{g.letter}</span>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: "650",
                          lineHeight: "1.15",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {g.name}
                      </span>
                    </span>
                    <button
                      onClick={g.identify}
                      style={{
                        height: "40px",
                        borderRadius: "20px",
                        border: "1.5px solid #1E1416",
                        background: "transparent",
                        fontWeight: "600",
                        fontSize: "12.5px",
                      }}
                    >
                      {g.identifyLabel}
                    </button>
                  </div>
                </Fragment>
              ))}
            </div>{" "}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                borderBottom: "1.5px solid #1E1416",
                paddingBottom: "6px",
                marginTop: "20px",
              }}
            >
              <h2
                className="f-disp"
                style={{ margin: "0", fontSize: "22px", fontWeight: "750" }}
              >
                Which way it leaned
              </h2>
              <span
                className="f-mono"
                style={{ fontSize: "10px", color: "#5E4E49" }}
              >
                Tap a line to change it
              </span>
            </div>{" "}
            {v.abRows.map((r, i26) => (
              <Fragment key={i26}>
                {" "}
                <button
                  onClick={r.edit}
                  aria-label={r.editAria}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    minHeight: "50px",
                    padding: "0 2px",
                    boxSizing: "border-box",
                    border: "0",
                    borderBottom: "1px solid rgba(30,20,22,.2)",
                    background: "transparent",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      fontWeight: "650",
                      fontSize: "14px",
                      width: "74px",
                      flex: "none",
                    }}
                  >
                    {r.name}
                  </span>
                  <span aria-hidden="true" ref={css(r.track)}>
                    <span
                      style={{
                        flex: "1",
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                      }}
                    >
                      <span ref={css(r.aBar)}>{r.aTxt}</span>
                    </span>
                    <span ref={css(r.axis)} />
                    <span
                      style={{
                        flex: "1",
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                      }}
                    >
                      <span ref={css(r.bBar)}>{r.bTxt}</span>
                    </span>
                    <span ref={css(r.mid)}>{r.midText}</span>
                  </span>
                  <span ref={css(r.labelStyle)}>{r.label}</span>
                </button>{" "}
              </Fragment>
            ))}{" "}
            <p
              className="f-disp"
              style={{
                margin: "14px 0 0",
                fontSize: "17px",
                lineHeight: "1.3",
                fontStyle: "italic",
              }}
            >
              {v.abSentence}
            </p>{" "}
            <p
              style={{ margin: "6px 0 0", fontSize: "12px", color: "#5E4E49" }}
            >
              Relative impressions, not scores. Nothing here knows a right
              answer.
            </p>{" "}
            <h2
              className="f-disp"
              style={{
                margin: "24px 0 2px",
                fontSize: "22px",
                fontWeight: "750",
              }}
            >
              Which would you pour another glass of?
            </h2>{" "}
            <p
              style={{ margin: "0 0 10px", fontSize: "13px", color: "#5E4E49" }}
            >
              Optional, and kept apart from what you noticed.
            </p>{" "}
            <div
              role="group"
              aria-label="Preference"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: "6px",
              }}
            >
              {v.prefOpts.map((o, i27) => (
                <Fragment key={i27}>
                  <button
                    onClick={o.pick}
                    aria-pressed={o.pressed as AriaBool}
                    className={o.cls}
                    ref={css(o.style)}
                  >
                    <span aria-hidden="true" ref={css(o.mark)}>
                      {o.markText}
                    </span>
                    <span>{o.label}</span>
                  </button>
                </Fragment>
              ))}
            </div>{" "}
            <h2
              className="f-disp"
              style={{
                margin: "24px 0 8px",
                fontSize: "22px",
                fontWeight: "750",
              }}
            >
              {"Your words "}
              <span
                className="f-mono"
                style={{
                  fontSize: "10px",
                  fontWeight: "400",
                  color: "#5E4E49",
                  verticalAlign: "middle",
                  marginLeft: "4px",
                }}
              >
                Optional
              </span>
            </h2>{" "}
            <label htmlFor="abnotes" className="sr">
              Notes about this comparison
            </label>{" "}
            <textarea
              id="abnotes"
              value={v.abNotes}
              onChange={v.onAbNotes}
              rows={3}
              placeholder="Anything at all."
              style={{
                width: "100%",
                boxSizing: "border-box",
                minHeight: "84px",
                borderRadius: "14px",
                border: "1.5px solid #1E1416",
                background: "#FBF6EA",
                padding: "12px 14px",
                fontSize: "18px",
                lineHeight: "1.35",
                resize: "none",
                fontFamily: "'Fraunces', Georgia, serif",
                fontStyle: "italic",
              }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              left: "0",
              right: "0",
              bottom: "0",
              padding:
                "10px 16px calc(18px + env(safe-area-inset-bottom, 0px))",
              background: "#F5ECD7",
              borderTop: "1.5px solid #1E1416",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <span
              className="f-mono"
              style={{
                fontSize: "9.5px",
                color: "#5E4E49",
                textAlign: "center",
              }}
            >
              {v.abSaveHint}
            </span>
            <button
              className="press"
              onClick={v.saveAB}
              style={{
                height: "60px",
                borderRadius: "18px",
                border: "1.5px solid #1E1416",
                background: "#F2CF5B",
                fontWeight: "700",
                fontSize: "17px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              Save comparison
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12.5l4.5 4.5L19 7" />
              </svg>
            </button>
          </div>
        </>
      ) : null}
      {/* B4 · SAVED A/B SESSION */}
      {v.isAbView ? (
        <>
          <div
            className="fade scroll"
            style={{
              position: "absolute",
              inset: "0 0 calc(96px + env(safe-area-inset-bottom, 0px)) 0",
              overflowY: "auto",
              padding: "8px 16px 26px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                height: "44px",
              }}
            >
              <button
                onClick={v.goJournalSessions}
                style={{
                  height: "44px",
                  border: "0",
                  background: "transparent",
                  marginLeft: "-8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 5l-7 7 7 7" />
                </svg>
                Journal
              </button>
              <span
                className="f-mono"
                style={{ fontSize: "10.5px", color: "#5E4E49" }}
              >
                {v.sv.date}
              </span>
            </div>{" "}
            <div
              className="f-mono"
              style={{ fontSize: "10.5px", color: "#5A1427", marginTop: "4px" }}
            >
              {v.sv.kind}
            </div>{" "}
            <h1
              className="f-disp"
              style={{
                margin: "4px 0 14px",
                fontSize: "36px",
                lineHeight: "0.95",
                fontWeight: "850",
                letterSpacing: "-0.025em",
              }}
            >
              Two glasses, one mouth.
            </h1>{" "}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "8px",
              }}
            >
              {v.sv.glasses.map((g, i28) => (
                <Fragment key={i28}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      minWidth: "0",
                      paddingTop: "10px",
                      borderTop: "4px solid #1E1416",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span ref={css(g.mark)}>{g.letter}</span>
                      <span className="f-mono" style={{ fontSize: "9.5px" }}>
                        {g.side}
                      </span>
                    </span>
                    <span
                      className="f-disp"
                      style={{
                        fontSize: "17px",
                        fontWeight: "700",
                        lineHeight: "1.1",
                      }}
                    >
                      {g.name}
                    </span>
                    <span style={{ fontSize: "12px", color: "#5E4E49" }}>
                      {g.sub}
                    </span>
                    {g.hasEntry ? (
                      <>
                        <button
                          onClick={g.open}
                          style={{
                            alignSelf: "flex-start",
                            height: "40px",
                            padding: "0 12px",
                            borderRadius: "20px",
                            border: "1.5px solid #1E1416",
                            background: "transparent",
                            fontWeight: "600",
                            fontSize: "12.5px",
                          }}
                        >
                          Tasting record →
                        </button>
                      </>
                    ) : null}
                  </div>
                </Fragment>
              ))}
            </div>{" "}
            <div
              style={{ borderTop: "1.5px solid #1E1416", marginTop: "18px" }}
            >
              {v.sv.rows.map((r, i29) => (
                <Fragment key={i29}>
                  {" "}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      minHeight: "46px",
                      borderBottom: "1px solid rgba(30,20,22,.2)",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: "650",
                        fontSize: "14px",
                        width: "74px",
                        flex: "none",
                      }}
                    >
                      {r.name}
                    </span>
                    <span aria-hidden="true" ref={css(r.track)}>
                      <span
                        style={{
                          flex: "1",
                          display: "flex",
                          justifyContent: "flex-end",
                          alignItems: "center",
                        }}
                      >
                        <span ref={css(r.aBar)}>{r.aTxt}</span>
                      </span>
                      <span ref={css(r.axis)} />
                      <span
                        style={{
                          flex: "1",
                          display: "flex",
                          justifyContent: "flex-start",
                          alignItems: "center",
                        }}
                      >
                        <span ref={css(r.bBar)}>{r.bTxt}</span>
                      </span>
                      <span ref={css(r.mid)}>{r.midText}</span>
                    </span>
                    <span ref={css(r.labelStyle)}>{r.label}</span>
                  </div>{" "}
                </Fragment>
              ))}
            </div>{" "}
            <p
              className="f-disp"
              style={{
                margin: "14px 0 0",
                fontSize: "17px",
                lineHeight: "1.3",
                fontStyle: "italic",
              }}
            >
              {v.sv.sentence}
            </p>{" "}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "14px",
                paddingTop: "10px",
                borderTop: "1px solid rgba(30,20,22,.2)",
              }}
            >
              <span
                className="f-mono"
                style={{ fontSize: "10.5px", color: "#5E4E49" }}
              >
                Would pour another
              </span>
              <span style={{ fontWeight: "650" }}>{v.sv.pref}</span>
            </div>{" "}
            {v.sv.hasNotes ? (
              <>
                <blockquote
                  className="f-disp"
                  style={{
                    margin: "12px 0 0",
                    fontSize: "26px",
                    lineHeight: "1.08",
                    fontStyle: "italic",
                    fontWeight: "500",
                    color: "#5A1427",
                  }}
                >
                  “{v.sv.notes}”
                </blockquote>
              </>
            ) : null}{" "}
            <section
              aria-label="Looking back"
              style={{
                marginTop: "24px",
                borderTop: "1.5px solid #1E1416",
                paddingTop: "12px",
              }}
            >
              <h2
                className="f-disp"
                style={{
                  margin: "0 0 4px",
                  fontSize: "22px",
                  fontWeight: "750",
                }}
              >
                Looking back
              </h2>{" "}
              {v.sv.lbNone ? (
                <>
                  <p
                    style={{
                      margin: "0",
                      fontSize: "13.5px",
                      color: "#3E302D",
                    }}
                  >
                    No earlier notes on both of these wines yet. That’s fine:
                    today’s comparison stands on its own.
                  </p>
                </>
              ) : null}{" "}
              {v.sv.lbClosed ? (
                <>
                  {" "}
                  <p
                    style={{
                      margin: "0 0 8px",
                      fontSize: "13.5px",
                      color: "#3E302D",
                    }}
                  >
                    {v.sv.lbIntro}
                  </p>{" "}
                  <button
                    onClick={v.toggleLookBack}
                    style={{
                      height: "44px",
                      padding: "0 16px",
                      borderRadius: "22px",
                      border: "1.5px solid #1E1416",
                      background: "transparent",
                      fontWeight: "600",
                      fontSize: "14px",
                    }}
                  >
                    Show my earlier notes
                  </button>{" "}
                </>
              ) : null}{" "}
              {v.sv.lbOpen ? (
                <>
                  {" "}
                  <div className="fade">
                    {v.sv.lbGroups.map((lg, i30) => (
                      <Fragment key={i30}>
                        {" "}
                        <div
                          className="f-mono"
                          style={{
                            fontSize: "10px",
                            color: "#5E4E49",
                            margin: "8px 0 4px",
                          }}
                        >
                          {lg.title}
                        </div>{" "}
                        <ul
                          style={{
                            margin: "0",
                            padding: "0",
                            listStyle: "none",
                          }}
                        >
                          {lg.lines.map((ln, i31) => (
                            <Fragment key={i31}>
                              {" "}
                              <li
                                style={{
                                  display: "flex",
                                  gap: "10px",
                                  alignItems: "flex-start",
                                  padding: "8px 0",
                                  borderBottom: "1px solid rgba(30,20,22,.15)",
                                  fontSize: "13.5px",
                                  lineHeight: "1.4",
                                }}
                              >
                                <span ref={css(ln.tagStyle)}>{ln.tag}</span>
                                <span>{ln.t}</span>
                              </li>{" "}
                            </Fragment>
                          ))}
                        </ul>{" "}
                        <p
                          style={{
                            margin: "6px 0 0",
                            fontSize: "13px",
                            fontWeight: "600",
                          }}
                        >
                          {lg.sum}
                        </p>{" "}
                      </Fragment>
                    ))}{" "}
                    <p
                      style={{
                        margin: "10px 0 0",
                        padding: "10px 12px",
                        borderRadius: "12px",
                        background: "#EADFC6",
                        fontSize: "12.5px",
                        lineHeight: "1.45",
                        color: "#3E302D",
                      }}
                    >
                      {v.sv.lbCaveat}
                    </p>
                  </div>{" "}
                </>
              ) : null}
            </section>{" "}
            {v.sv.hasRefs ? (
              <>
                {" "}
                <section
                  aria-label="Producer notes"
                  style={{
                    marginTop: "20px",
                    borderTop: "1.5px solid #1E1416",
                    paddingTop: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <h2
                      className="f-disp"
                      style={{
                        margin: "0",
                        fontSize: "20px",
                        fontWeight: "750",
                      }}
                    >
                      From the label, not your mouth
                    </h2>
                    <button
                      onClick={v.toggleRefs}
                      style={{
                        height: "40px",
                        border: "0",
                        background: "transparent",
                        fontWeight: "600",
                        fontSize: "13px",
                        textDecoration: "underline",
                      }}
                    >
                      {v.sv.refsBtn}
                    </button>
                  </div>{" "}
                  {v.sv.refsOpen ? (
                    <>
                      {" "}
                      <div className="fade" style={{ marginTop: "6px" }}>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            fontSize: "12.5px",
                            padding: "6px 0",
                            borderBottom: "1.5px solid #1E1416",
                          }}
                          className="f-mono"
                        >
                          <span>Producer says</span>
                          <span>A</span>
                          <span>B</span>
                        </div>{" "}
                        {v.sv.refs.map((rf, i32) => (
                          <Fragment key={i32}>
                            {" "}
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr",
                                fontSize: "13px",
                                padding: "7px 0",
                                borderBottom: "1px solid rgba(30,20,22,.15)",
                              }}
                            >
                              <span style={{ fontWeight: "600" }}>
                                {rf.name}
                              </span>
                              <span>{rf.a}</span>
                              <span>{rf.b}</span>
                            </div>{" "}
                          </Fragment>
                        ))}{" "}
                        <p
                          style={{
                            margin: "8px 0 0",
                            fontSize: "12px",
                            color: "#5E4E49",
                          }}
                        >
                          Illustrative producer notes for fictional wines.
                          Useful context, not the answer key. Labels are written
                          by people who want you to buy the wine.
                        </p>
                      </div>{" "}
                    </>
                  ) : null}
                </section>{" "}
              </>
            ) : null}
          </div>
          <div
            style={{
              position: "absolute",
              left: "0",
              right: "0",
              bottom: "0",
              padding:
                "12px 16px calc(18px + env(safe-area-inset-bottom, 0px))",
              background: "#F5ECD7",
              borderTop: "1.5px solid #1E1416",
              display: "grid",
              gridTemplateColumns: "1fr 1.7fr",
              gap: "10px",
            }}
          >
            <button
              className="press"
              onClick={v.goJournalSessions}
              style={{
                height: "60px",
                borderRadius: "18px",
                border: "1.5px solid #1E1416",
                background: "#FBF6EA",
                fontWeight: "650",
                fontSize: "15px",
              }}
            >
              Journal
            </button>
            <button
              className="press"
              onClick={v.repeatAB}
              style={{
                height: "60px",
                borderRadius: "18px",
                border: "1.5px solid #1E1416",
                background: "#F2CF5B",
                fontWeight: "700",
                fontSize: "15px",
                lineHeight: "1.1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span>Repeat this pair</span>
              <span style={{ fontWeight: "400", fontSize: "11.5px" }}>
                Today’s answers stay hidden
              </span>
            </button>
          </div>
        </>
      ) : null}
      {/* A/B THUMB DOCK (same dock, two-glass answers) */}
      {v.abShowDock ? (
        <>
          {" "}
          {v.abSheetMode ? (
            <>
              <button
                aria-label="Close editor"
                onClick={v.abCloseEdit}
                className="fade"
                style={{
                  position: "absolute",
                  inset: "0",
                  border: "0",
                  background: "rgba(30,20,22,.45)",
                  zIndex: "20",
                  padding: "0",
                }}
              />
            </>
          ) : null}{" "}
          <section
            aria-label="Comparison controls"
            data-dock=""
            className={v.abDockCls}
            ref={css(v.abDockStyle)}
          >
            <span role="status" aria-live="polite" className="sr">
              {v.liveMsg}
            </span>{" "}
            <div
              aria-hidden="true"
              style={{
                display: "flex",
                gap: "4px",
                alignItems: "center",
                height: "6px",
              }}
            >
              {v.abNotches.map((n, i33) => (
                <Fragment key={i33}>
                  <span ref={css(n.style)} />
                </Fragment>
              ))}
            </div>{" "}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginTop: "12px",
              }}
            >
              <div style={{ flex: "1", minWidth: "0" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "8px",
                  }}
                >
                  <h2
                    className="f-disp"
                    style={{
                      margin: "0",
                      fontSize: "22px",
                      fontWeight: "800",
                      lineHeight: "1.05",
                    }}
                  >
                    {v.abF.name}
                  </h2>
                  <span
                    className="f-mono"
                    style={{ fontSize: "9.5px", color: "#5E4E49" }}
                  >
                    {v.abF.pos}
                  </span>
                </div>{" "}
                <p
                  style={{
                    margin: "1px 0 0",
                    fontSize: "14.5px",
                    color: "#3E302D",
                    lineHeight: "1.3",
                    fontWeight: "600",
                  }}
                >
                  {v.abF.q}
                </p>
              </div>
              <button
                onClick={v.abClearCur}
                aria-label={v.abF.clearAria}
                disabled={v.abClearDisabled}
                ref={css(v.abClearStyle)}
              >
                Clear
              </button>
              <button
                onClick={v.abOpenGuide}
                aria-label={v.abF.guideAria}
                style={{
                  height: "44px",
                  minWidth: "56px",
                  padding: "0 12px",
                  borderRadius: "22px",
                  border: "1.5px solid #1E1416",
                  background: "transparent",
                  fontWeight: "650",
                  fontSize: "13px",
                  flex: "none",
                }}
              >
                How?
              </button>
            </div>{" "}
            <div
              role="group"
              aria-label={v.abF.q}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "8px",
                marginTop: "12px",
              }}
            >
              <button
                onClick={v.abPickA}
                aria-pressed={v.abAPressed as AriaBool}
                className={v.abACls}
                ref={css(v.abAStyle)}
              >
                <span aria-hidden="true" ref={css(v.abAMark)}>
                  A
                </span>
                <span
                  style={{
                    fontWeight: "700",
                    fontSize: "15px",
                    lineHeight: "1.1",
                  }}
                >
                  {v.abF.aLabel}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    opacity: ".8",
                    maxWidth: "100%",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {v.abNameA}
                </span>
              </button>
              <button
                onClick={v.abPickB}
                aria-pressed={v.abBPressed as AriaBool}
                className={v.abBCls}
                ref={css(v.abBStyle)}
              >
                <span aria-hidden="true" ref={css(v.abBMark)}>
                  B
                </span>
                <span
                  style={{
                    fontWeight: "700",
                    fontSize: "15px",
                    lineHeight: "1.1",
                  }}
                >
                  {v.abF.bLabel}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    opacity: ".8",
                    maxWidth: "100%",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {v.abNameB}
                </span>
              </button>
            </div>{" "}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "8px",
                marginTop: "8px",
              }}
            >
              <button
                onClick={v.abPickSame}
                aria-pressed={v.abSamePressed as AriaBool}
                className={v.abSameCls}
                ref={css(v.abSameStyle)}
              >
                <span
                  aria-hidden="true"
                  style={{
                    fontWeight: "800",
                    fontSize: "17px",
                    lineHeight: "1",
                  }}
                >
                  =
                </span>
                About the same
              </button>
              <button
                onClick={v.abPickUnsure}
                aria-pressed={v.abUnsurePressed as AriaBool}
                className={v.abUnsureCls}
                ref={css(v.abUnsureStyle)}
              >
                <span
                  aria-hidden="true"
                  className="f-mono"
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    border: "1.5px solid currentColor",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    letterSpacing: "0",
                  }}
                >
                  ?
                </span>
                Can’t tell
              </button>
            </div>{" "}
            <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
              <button
                aria-label="Previous sensation"
                onClick={v.abPrev}
                className="press"
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  border: "1.5px solid #1E1416",
                  background: "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "none",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <button
                aria-label="Next sensation"
                onClick={v.abNext}
                className="press"
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  border: "1.5px solid #1E1416",
                  background: "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "none",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={v.abPrimary}
                className={v.abPrimaryCls}
                ref={css(v.abPrimaryStyle)}
              >
                {v.abPrimaryLabel}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 12h15M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </section>
        </>
      ) : null}
      {/* A/B GUIDANCE */}
      {v.abGuide ? (
        <>
          {" "}
          <button
            aria-label="Close guidance"
            onClick={v.abCloseGuide}
            className="fade"
            style={{
              position: "absolute",
              inset: "0",
              border: "0",
              padding: "0",
              background: "rgba(30,20,22,.45)",
              zIndex: "40",
            }}
          />{" "}
          <section
            className="rise"
            role="dialog"
            aria-label={v.abF.guideAria}
            style={{
              position: "absolute",
              left: "0",
              right: "0",
              bottom: "0",
              zIndex: "41",
              background: "#FBF6EA",
              borderRadius: "22px 22px 0 0",
              padding:
                "20px 16px calc(18px + env(safe-area-inset-bottom, 0px))",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              boxShadow: "0 -14px 40px rgba(30,20,22,.28)",
            }}
          >
            <div
              className="f-mono"
              style={{ fontSize: "10.5px", color: "#5A1427" }}
            >
              {"What to notice · "}
              {v.abF.name}
            </div>
            <h2
              className="f-disp"
              style={{
                margin: "0",
                fontSize: "25px",
                lineHeight: "1.08",
                fontWeight: "800",
              }}
            >
              {v.abF.q}
            </h2>
            <ol
              style={{
                margin: "0",
                padding: "0",
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {v.abF.steps.map((st, i34) => (
                <Fragment key={i34}>
                  <li
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      className="f-disp"
                      aria-hidden="true"
                      style={{
                        fontSize: "24px",
                        fontWeight: "800",
                        color: "#5A1427",
                        width: "18px",
                        lineHeight: "1",
                        flex: "none",
                      }}
                    >
                      {st.n}
                    </span>
                    <span style={{ fontSize: "15px", lineHeight: "1.4" }}>
                      {st.t}
                    </span>
                  </li>
                </Fragment>
              ))}
            </ol>
            <p
              style={{
                margin: "0",
                fontSize: "13px",
                color: "#5E4E49",
                paddingTop: "10px",
                borderTop: "1px solid rgba(30,20,22,.2)",
              }}
            >
              Nothing here knows the answer. “About the same” and “Can’t tell”
              are real results.
            </p>
            <button
              className="press"
              onClick={v.abCloseGuide}
              style={{
                height: "58px",
                borderRadius: "18px",
                border: "1.5px solid #1E1416",
                background: "#F2CF5B",
                fontWeight: "700",
                fontSize: "16px",
              }}
            >
              Got it. Back to the glasses
            </button>
          </section>
        </>
      ) : null}
      {/* A/B: NAME A GLASS SHEET */}
      {v.abSlotOpen ? (
        <>
          {" "}
          <button
            aria-label="Close"
            onClick={v.abCloseSlot}
            className="fade"
            style={{
              position: "absolute",
              inset: "0",
              border: "0",
              padding: "0",
              background: "rgba(30,20,22,.45)",
              zIndex: "40",
            }}
          />{" "}
          <section
            className="rise"
            role="dialog"
            aria-label={v.abSlotTitle}
            style={{
              position: "absolute",
              left: "0",
              right: "0",
              bottom: "0",
              zIndex: "41",
              background: "#FBF6EA",
              borderRadius: "22px 22px 0 0",
              padding:
                "18px 16px calc(18px + env(safe-area-inset-bottom, 0px))",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              maxHeight: "88%",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span ref={css(v.abSlotMark)}>{v.abSlotLetter}</span>
              <h2
                className="f-disp"
                style={{ margin: "0", fontSize: "24px", fontWeight: "800" }}
              >
                {v.abSlotTitle}
              </h2>
            </div>
            {v.abSlotBlind ? (
              <>
                <p
                  style={{
                    margin: "0",
                    padding: "8px 10px",
                    borderRadius: "10px",
                    background: "#F2CF5B",
                    fontSize: "12.5px",
                    fontWeight: "600",
                  }}
                >
                  Pourer only. The taster should look away for this bit. Names
                  stay hidden until the comparison is saved.
                </p>
              </>
            ) : null}
            <div
              className="scroll"
              style={{
                overflowY: "auto",
                borderTop: "1.5px solid #1E1416",
                flex: "1",
                minHeight: "120px",
              }}
            >
              {v.abWineOpts.map((w, i35) => (
                <Fragment key={i35}>
                  {" "}
                  <button
                    onClick={w.pick}
                    aria-pressed={w.pressed as AriaBool}
                    ref={css(w.style)}
                  >
                    <span
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        minWidth: "0",
                      }}
                    >
                      <span
                        className="f-disp"
                        style={{ fontSize: "16px", fontWeight: "650" }}
                      >
                        {w.title}
                      </span>
                      <span style={{ fontSize: "12px", color: "#5E4E49" }}>
                        {w.sub}
                      </span>
                    </span>
                    <span
                      className="f-mono"
                      style={{ fontSize: "9.5px", flex: "none" }}
                    >
                      {w.tag}
                    </span>
                  </button>{" "}
                </Fragment>
              ))}
            </div>
            <label
              htmlFor="abname"
              style={{ fontSize: "13px", fontWeight: "600" }}
            >
              Or type what the bottle says
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                id="abname"
                value={v.abSlotName}
                onChange={v.onAbSlotName}
                placeholder="e.g. The one with the bird"
                autoComplete="off"
                style={{
                  flex: "1",
                  minWidth: "0",
                  height: "50px",
                  borderRadius: "14px",
                  border: "1.5px solid #1E1416",
                  background: "#F5ECD7",
                  padding: "0 12px",
                  fontSize: "16px",
                }}
              />
              <button
                onClick={v.useAbName}
                style={{
                  height: "50px",
                  padding: "0 14px",
                  borderRadius: "14px",
                  border: "1.5px solid #1E1416",
                  background: "#F2CF5B",
                  fontWeight: "700",
                }}
              >
                Use
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "8px",
              }}
            >
              <button
                onClick={v.abSnapLabel}
                style={{
                  height: "50px",
                  borderRadius: "14px",
                  border: "1.5px solid #1E1416",
                  background: "transparent",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                {v.abSnapLabelText}
              </button>
              <button
                onClick={v.abLeaveUnnamed}
                style={{
                  height: "50px",
                  borderRadius: "14px",
                  border: "1.5px solid #1E1416",
                  background: "transparent",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Leave unnamed
              </button>
            </div>
          </section>
        </>
      ) : null}
      {/* COMPARE CHOOSER */}
      {v.chooser ? (
        <>
          {" "}
          <button
            aria-label="Close"
            onClick={v.closeChooser}
            className="fade"
            style={{
              position: "absolute",
              inset: "0",
              border: "0",
              padding: "0",
              background: "rgba(30,20,22,.45)",
              zIndex: "40",
            }}
          />{" "}
          <section
            className="rise"
            role="dialog"
            aria-label="Compare"
            style={{
              position: "absolute",
              left: "0",
              right: "0",
              bottom: "0",
              zIndex: "41",
              background: "#FBF6EA",
              borderRadius: "22px 22px 0 0",
              padding:
                "20px 16px calc(18px + env(safe-area-inset-bottom, 0px))",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div
              className="f-mono"
              style={{ fontSize: "10.5px", color: "#5A1427" }}
            >
              Compare
            </div>
            <h2
              className="f-disp"
              style={{
                margin: "0 0 4px",
                fontSize: "26px",
                lineHeight: "1.05",
                fontWeight: "800",
              }}
            >
              Spot the difference. Or don’t. That’s useful too.
            </h2>
            <button
              className="press"
              onClick={v.chooseAB}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px",
                borderRadius: "16px",
                border: "1.5px solid #1E1416",
                background: "#F2CF5B",
                textAlign: "left",
              }}
            >
              <span
                aria-hidden="true"
                style={{ display: "flex", gap: "4px", flex: "none" }}
              >
                <span
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: "#5A1427",
                    color: "#FBF6EA",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Fraunces', serif",
                    fontWeight: "800",
                  }}
                >
                  A
                </span>
                <span
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "5px",
                    background: "#8A5608",
                    color: "#FBF6EA",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Fraunces', serif",
                    fontWeight: "800",
                  }}
                >
                  B
                </span>
              </span>
              <span style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: "700", fontSize: "16px" }}>
                  Two glasses, now
                </span>
                <span style={{ fontSize: "13px", color: "#3E302D" }}>
                  Sip both and say which way each sensation leans.
                </span>
              </span>
            </button>
            <button
              className="press"
              onClick={v.chooseSaved}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px",
                borderRadius: "16px",
                border: "1.5px solid #1E1416",
                background: "transparent",
                textAlign: "left",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: "64px",
                  flex: "none",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
                  <rect x="2" y="3" width="16" height="5" fill="#5A1427" />
                  <rect x="22" y="3" width="10" height="5" fill="#A66A0A" />
                  <rect x="8" y="12" width="10" height="5" fill="#5A1427" />
                  <rect x="22" y="12" width="16" height="5" fill="#A66A0A" />
                  <path d="M20 0v24" stroke="#1E1416" strokeWidth="1.5" />
                </svg>
              </span>
              <span style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: "700", fontSize: "16px" }}>
                  Two saved tastings
                </span>
                <span style={{ fontSize: "13px", color: "#3E302D" }}>
                  Put two journal entries side by side.
                </span>
              </span>
            </button>
          </section>
        </>
      ) : null}
      {/* GUIDANCE BAR AND PANEL (record screen, app only) */}
      {v.guideBar ? (
        <>
          {/* Always mounted so it can slide and fade both ways (see .guide-panel); closed, it is hidden from sight and from assistive tech. */}
          {
            <section
              id="guide-panel"
              role="region"
              aria-label={v.fs.guideAria}
              data-guide-panel=""
              data-open={v.guideOpen ? "true" : "false"}
              inert={!v.guideOpen}
              className="scroll guide-panel"
              tabIndex={-1}
              style={{
                position: "absolute",
                left: "0",
                right: "0",
                top: "0",
                bottom: "calc(392px + env(safe-area-inset-bottom, 0px))",
                zIndex: "22",
                background: "#FBF6EA",
                overflowY: "auto",
                overscrollBehavior: "contain",
                padding: "16px 16px 18px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {v.guideIntro ? (
                <p
                  data-guide-intro=""
                  style={{
                    margin: "0",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    background: "#F2CF5B",
                    fontSize: "13.5px",
                    fontWeight: "600",
                    lineHeight: "1.35",
                  }}
                >
                  {v.guideIntroText}
                </p>
              ) : null}
              <ol
                style={{
                  margin: "0",
                  padding: "0",
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {v.fs.steps.map((st, i39) => (
                  <Fragment key={i39}>
                    <li
                      style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        className="f-disp"
                        aria-hidden="true"
                        style={{
                          fontSize: "24px",
                          fontWeight: "800",
                          color: "#5A1427",
                          width: "18px",
                          lineHeight: "1",
                          flex: "none",
                        }}
                      >
                        {st.n}
                      </span>
                      <span style={{ fontSize: "15px", lineHeight: "1.4" }}>
                        {st.t}
                      </span>
                    </li>
                  </Fragment>
                ))}
              </ol>
              <p
                data-guide-note=""
                style={{
                  margin: "0",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1.5px solid rgba(30,20,22,.35)",
                  fontSize: "14px",
                  lineHeight: "1.4",
                  color: "#3E302D",
                }}
              >
                {v.fs.foot}
              </p>
            </section>
          }
          <button
            data-guide-bar=""
            aria-expanded={v.guideOpen}
            aria-controls="guide-panel"
            aria-label={
              v.guideOpen ? v.guideBarLabel + ". Hide guide" : v.guideBarLabel
            }
            onClick={v.toggleGuide}
            className="press guide-bar"
            style={{
              position: "absolute",
              left: "0",
              right: "0",
              bottom: "calc(348px + env(safe-area-inset-bottom, 0px))",
              height: "44px",
              zIndex: "22",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              padding: "0 16px",
              border: "0",
              borderTop: "1.5px solid #1E1416",
              background: v.guideOpen ? "#1E1416" : "#F2CF5B",
              color: v.guideOpen ? "#FBF6EA" : "#1E1416",
              fontWeight: "700",
              fontSize: "14px",
              textAlign: "left",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                minWidth: "0",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {v.guideBarLabel.charAt(0).toUpperCase() +
                v.guideBarLabel.slice(1)}
            </span>
            <span
              aria-hidden="true"
              className="f-mono"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                flex: "none",
                fontSize: "10.5px",
                fontWeight: "500",
              }}
            >
              {v.guideOpen ? "HIDE" : "SHOW"}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: v.guideOpen ? "rotate(180deg)" : "none",
                  transition: "transform 420ms cubic-bezier(.22,.8,.2,1)",
                }}
              >
                <path d="M6 15l6-6 6 6" />
              </svg>
            </span>
          </button>
        </>
      ) : null}
      {/* THE THUMB DOCK (Record + summary editor share one control) */}
      {v.showDock ? (
        <>
          {" "}
          {v.dockSheet ? (
            <>
              <button
                aria-label="Close editor"
                onClick={v.closeEdit}
                className="fade"
                style={{
                  position: "absolute",
                  inset: "0",
                  border: "0",
                  background: "rgba(30,20,22,.45)",
                  zIndex: "20",
                  padding: "0",
                }}
              />
            </>
          ) : null}{" "}
          <section
            aria-label="Sensation controls"
            data-dock=""
            className={v.dockCls}
            ref={css(v.dockStyle)}
          >
            <span role="status" aria-live="polite" className="sr">
              {v.liveMsg}
            </span>{" "}
            <div
              aria-hidden="true"
              style={{
                display: "flex",
                gap: "4px",
                alignItems: "center",
                height: "6px",
              }}
            >
              {v.notches.map((n, i36) => (
                <Fragment key={i36}>
                  <span ref={css(n.style)} />
                </Fragment>
              ))}
            </div>{" "}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginTop: "12px",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  background: "#F2CF5B",
                  border: "1.5px solid #1E1416",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "none",
                }}
              >
                {v.fs.iSweet ? (
                  <>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1E1416"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    >
                      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z M4 7.5l8 4.5 8-4.5 M12 12v9" />
                    </svg>
                  </>
                ) : null}
                {v.fs.iAcid ? (
                  <>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1E1416"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    >
                      <path d="M12 3c0 0-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11z" />
                      <path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5" />
                    </svg>
                  </>
                ) : null}
                {v.fs.iTannin ? (
                  <>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1E1416"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    >
                      <path d="M3 8l3-2 3 2 3-2 3 2 3-2 3 2 M3 13l3-2 3 2 3-2 3 2 3-2 3 2 M3 18l3-2 3 2 3-2 3 2 3-2 3 2" />
                    </svg>
                  </>
                ) : null}
                {v.fs.iBody ? (
                  <>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1E1416"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    >
                      <path d="M9 8a3 3 0 0 1 6 0 M5 9h14l2 11H3z" />
                    </svg>
                  </>
                ) : null}
                {v.fs.iWarm ? (
                  <>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1E1416"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    >
                      <path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4.5 3-6 .5 2 1.5 3 3 3-1-3-1-5.5 0-8z" />
                    </svg>
                  </>
                ) : null}
                {v.fs.iFinish ? (
                  <>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1E1416"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    >
                      <path d="M7 3h10 M7 21h10 M8 3c0 5 8 6 8 9s-8 4-8 9 M16 3c0 5-8 6-8 9s8 4 8 9" />
                    </svg>
                  </>
                ) : null}
              </span>
              <div style={{ flex: "1", minWidth: "0" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "8px",
                  }}
                >
                  <h2
                    className="f-disp"
                    style={{
                      margin: "0",
                      fontSize: "22px",
                      fontWeight: "800",
                      lineHeight: "1.05",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {v.fs.name}
                  </h2>
                  <span
                    className="f-mono"
                    style={{ fontSize: "9.5px", color: "#5E4E49" }}
                  >
                    {v.fs.sub}
                  </span>
                </div>{" "}
                <p
                  style={{
                    margin: "1px 0 0",
                    fontSize: "14px",
                    color: "#3E302D",
                    lineHeight: "1.3",
                  }}
                >
                  {v.fs.q}
                </p>
              </div>
              <button
                onClick={v.clearCur}
                aria-label={v.fs.clearAria}
                disabled={v.clearDisabled}
                ref={css(v.clearStyle)}
              >
                Clear
              </button>
              {v.showHow ? (
                <button
                  onClick={v.openGuide}
                  aria-label={v.fs.guideAria}
                  style={{
                    height: "44px",
                    minWidth: "56px",
                    padding: "0 12px",
                    borderRadius: "22px",
                    border: "1.5px solid #1E1416",
                    background: "transparent",
                    fontWeight: "650",
                    fontSize: "13px",
                    flex: "none",
                  }}
                >
                  How?
                </button>
              ) : null}
            </div>{" "}
            <div
              role="group"
              aria-label={v.fs.levelAria}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "8px",
                marginTop: "12px",
              }}
            >
              {v.levels.map((lv, i37) => (
                <Fragment key={i37}>
                  <button
                    onClick={lv.pick}
                    aria-pressed={lv.pressed as AriaBool}
                    aria-label={lv.aria}
                    className={lv.cls}
                    ref={css(lv.style)}
                  >
                    <span
                      aria-hidden="true"
                      ref={css(
                        `display: flex; align-items: ${v.barAlign}; gap: 3px; height: 26px`,
                      )}
                    >
                      {lv.bars.map((b, i38) => (
                        <Fragment key={i38}>
                          <span ref={css(b.style)} />
                        </Fragment>
                      ))}
                    </span>{" "}
                    <span
                      style={{
                        fontWeight: "700",
                        fontSize: "14px",
                        lineHeight: "1.1",
                      }}
                    >
                      {lv.label}
                    </span>{" "}
                    <span ref={css(lv.hintStyle)}>{lv.hint}</span>
                  </button>
                </Fragment>
              ))}
            </div>{" "}
            <div
              ref={css(
                `display: grid; grid-template-columns: ${v.altCols}; gap: 8px; margin-top: 8px`,
              )}
            >
              {v.fs.hasNone ? (
                <>
                  {" "}
                  <button
                    onClick={v.pickNone}
                    aria-pressed={v.nonePressed as AriaBool}
                    className={v.noneCls}
                    ref={css(v.noneStyle)}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: "13px",
                        height: "13px",
                        borderRadius: "50%",
                        border: "2px solid currentColor",
                        display: "inline-block",
                      }}
                    />
                    {v.fs.none}
                  </button>{" "}
                </>
              ) : null}{" "}
              <button
                onClick={v.pickUnsure}
                aria-pressed={v.unsurePressed as AriaBool}
                className={v.unsureCls}
                ref={css(v.unsureStyle)}
              >
                <span
                  aria-hidden="true"
                  className="f-mono"
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    border: "1.5px solid currentColor",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    letterSpacing: "0",
                  }}
                >
                  ?
                </span>
                Can’t tell
              </button>
            </div>{" "}
            <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
              <button
                aria-label="Previous sensation"
                onClick={v.prev}
                className="press"
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  border: "1.5px solid #1E1416",
                  background: "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "none",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <button
                aria-label="Next sensation"
                onClick={v.next}
                className="press"
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  border: "1.5px solid #1E1416",
                  background: "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "none",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={v.dockPrimary}
                className={v.dockPrimaryCls}
                ref={css(v.dockPrimaryStyle)}
              >
                {v.dockPrimaryLabel}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 12h15M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </section>
        </>
      ) : null}
      {/* GUIDANCE SHEET */}
      {v.guide ? (
        <>
          {" "}
          <button
            aria-label="Close guidance"
            onClick={v.closeGuide}
            className="fade"
            style={{
              position: "absolute",
              inset: "0",
              border: "0",
              padding: "0",
              background: "rgba(30,20,22,.45)",
              zIndex: "40",
            }}
          />{" "}
          <section
            className="rise"
            role="dialog"
            aria-label={v.fs.guideAria}
            style={{
              position: "absolute",
              left: "0",
              right: "0",
              bottom: "0",
              zIndex: "41",
              background: "#FBF6EA",
              borderRadius: "22px 22px 0 0",
              padding:
                "20px 16px calc(18px + env(safe-area-inset-bottom, 0px))",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              boxShadow: "0 -14px 40px rgba(30,20,22,.28)",
            }}
          >
            <div
              className="f-mono"
              style={{ fontSize: "10.5px", color: "#5A1427" }}
            >
              {"How to notice · "}
              {v.fs.name}
            </div>
            <h2
              className="f-disp"
              style={{
                margin: "0",
                fontSize: "25px",
                lineHeight: "1.08",
                fontWeight: "800",
              }}
            >
              {v.fs.q}
            </h2>
            <ol
              style={{
                margin: "0",
                padding: "0",
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {v.fs.steps.map((st, i39) => (
                <Fragment key={i39}>
                  <li
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      className="f-disp"
                      aria-hidden="true"
                      style={{
                        fontSize: "24px",
                        fontWeight: "800",
                        color: "#5A1427",
                        width: "18px",
                        lineHeight: "1",
                        flex: "none",
                      }}
                    >
                      {st.n}
                    </span>
                    <span style={{ fontSize: "15px", lineHeight: "1.4" }}>
                      {st.t}
                    </span>
                  </li>
                </Fragment>
              ))}
            </ol>
            <p
              style={{
                margin: "0",
                fontSize: "13px",
                color: "#5E4E49",
                paddingTop: "10px",
                borderTop: "1px solid rgba(30,20,22,.2)",
              }}
            >
              {v.fs.foot}
            </p>
            <button
              className="press"
              onClick={v.closeGuide}
              style={{
                height: "58px",
                borderRadius: "18px",
                border: "1.5px solid #1E1416",
                background: "#F2CF5B",
                fontWeight: "700",
                fontSize: "16px",
              }}
            >
              Got it. Back to the glass
            </button>
          </section>
        </>
      ) : null}
      {/* MANUAL ENTRY SHEET */}
      {v.manual ? (
        <>
          {" "}
          <button
            aria-label="Close"
            onClick={v.closeManual}
            className="fade"
            style={{
              position: "absolute",
              inset: "0",
              border: "0",
              padding: "0",
              background: "rgba(30,20,22,.45)",
              zIndex: "40",
            }}
          />{" "}
          <section
            className="rise"
            role="dialog"
            aria-label="Type in the wine"
            style={{
              position: "absolute",
              left: "0",
              right: "0",
              bottom: "0",
              zIndex: "41",
              background: "#FBF6EA",
              borderRadius: "22px 22px 0 0",
              padding:
                "20px 16px calc(18px + env(safe-area-inset-bottom, 0px))",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div
              className="f-mono"
              style={{ fontSize: "10.5px", color: "#5A1427" }}
            >
              Type it in
            </div>
            <h2
              className="f-disp"
              style={{
                margin: "0",
                fontSize: "25px",
                lineHeight: "1.08",
                fontWeight: "800",
              }}
            >
              What does the label say?
            </h2>
            <label
              htmlFor="mname"
              style={{ fontSize: "13px", fontWeight: "600" }}
            >
              Name, producer or anything legible
            </label>
            <input
              id="mname"
              value={v.mName}
              onChange={v.onMName}
              placeholder="e.g. Dad’s cellar, bottom shelf"
              autoComplete="off"
              style={{
                height: "52px",
                borderRadius: "14px",
                border: "1.5px solid #1E1416",
                background: "#F5ECD7",
                padding: "0 14px",
                fontSize: "16px",
              }}
            />
            <div
              style={{ fontSize: "13px", fontWeight: "600", marginTop: "2px" }}
            >
              {"Roughly what kind? "}
              <span style={{ fontWeight: "400", color: "#5E4E49" }}>
                Optional
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "8px",
              }}
            >
              {v.types.map((t, i40) => (
                <Fragment key={i40}>
                  <button
                    onClick={t.pick}
                    aria-pressed={t.pressed as AriaBool}
                    ref={css(t.style)}
                  >
                    {t.t}
                  </button>
                </Fragment>
              ))}
            </div>
            <button
              className="press"
              onClick={v.useManual}
              style={{
                height: "58px",
                borderRadius: "18px",
                border: "1.5px solid #1E1416",
                background: "#F2CF5B",
                fontWeight: "700",
                fontSize: "16px",
                marginTop: "4px",
              }}
            >
              Use this
            </button>
          </section>
        </>
      ) : null}
      {/* CAMERA (simulated) */}
      {v.camera ? (
        <>
          {" "}
          <section
            className="fade"
            role="dialog"
            aria-label="Label photo"
            style={{
              position: "absolute",
              inset: "0",
              zIndex: "50",
              background: "#120D0E",
              color: "#FBF6EA",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "18px 20px 12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="f-mono" style={{ fontSize: "10.5px" }}>
                Label photo
              </span>
              <span
                className="f-mono"
                style={{ fontSize: "9.5px", color: "#CDBFA6" }}
              >
                Simulated camera
              </span>
            </div>
            <div
              style={{
                flex: "1",
                position: "relative",
                margin: "0 20px",
                borderRadius: "20px",
                overflow: "hidden",
                background:
                  "radial-gradient(80% 60% at 50% 38%, #4A342C, #120D0E)",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "6%",
                  bottom: "-10%",
                  width: "176px",
                  transform: "translateX(-50%)",
                  borderRadius: "70px 70px 0 0",
                  background:
                    "linear-gradient(90deg, #0E0A0B, #2B1D1A 40%, #0E0A0B)",
                }}
              />{" "}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "34%",
                  width: "132px",
                  height: "170px",
                  transform: "translateX(-50%) rotate(-1deg)",
                  background: "#E8DFC9",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  color: "#3E302D",
                  borderTop: "4px solid #7E1F35",
                }}
              >
                <span className="f-mono" style={{ fontSize: "8px" }}>
                  {v.camProd}
                </span>
                <span
                  className="f-disp"
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    textAlign: "center",
                    lineHeight: "1",
                  }}
                >
                  {v.camTitle}
                </span>
                <span className="f-mono" style={{ fontSize: "8px" }}>
                  {v.camVin}
                </span>
              </div>{" "}
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "22%",
                  top: "30%",
                  width: "26px",
                  height: "26px",
                  borderLeft: "3px solid #F2CF5B",
                  borderTop: "3px solid #F2CF5B",
                }}
              />{" "}
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  right: "22%",
                  top: "30%",
                  width: "26px",
                  height: "26px",
                  borderRight: "3px solid #F2CF5B",
                  borderTop: "3px solid #F2CF5B",
                }}
              />{" "}
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "22%",
                  top: "calc(34% + 186px)",
                  width: "26px",
                  height: "26px",
                  borderLeft: "3px solid #F2CF5B",
                  borderBottom: "3px solid #F2CF5B",
                }}
              />{" "}
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  right: "22%",
                  top: "calc(34% + 186px)",
                  width: "26px",
                  height: "26px",
                  borderRight: "3px solid #F2CF5B",
                  borderBottom: "3px solid #F2CF5B",
                }}
              />{" "}
              <p
                style={{
                  position: "absolute",
                  left: "0",
                  right: "0",
                  bottom: "14px",
                  margin: "0",
                  textAlign: "center",
                  fontSize: "13px",
                  color: "#EADFC6",
                }}
              >
                Fill the frame with the front label.
              </p>
            </div>
            {v.camAim ? (
              <>
                <div
                  style={{
                    height: "150px",
                    display: "grid",
                    gridTemplateColumns: "1fr auto 1fr",
                    alignItems: "center",
                    padding: "0 24px",
                  }}
                >
                  <button
                    onClick={v.closeCamera}
                    style={{
                      justifySelf: "start",
                      height: "48px",
                      border: "0",
                      background: "transparent",
                      color: "#FBF6EA",
                      fontWeight: "600",
                      fontSize: "15px",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    aria-label="Take photo"
                    onClick={v.capture}
                    className="press"
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      border: "4px solid #FBF6EA",
                      background: "#F2CF5B",
                      boxShadow: "inset 0 0 0 4px #120D0E",
                    }}
                  />
                  <span />
                </div>
              </>
            ) : null}
            {v.camFound ? (
              <>
                <div
                  className="rise"
                  style={{
                    marginTop: "14px",
                    background: "#FBF6EA",
                    color: "#1E1416",
                    padding:
                      "18px 16px calc(18px + env(safe-area-inset-bottom, 0px))",
                    borderRadius: "22px 22px 0 0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <span
                    className="f-mono"
                    style={{ fontSize: "10.5px", color: "#5A1427" }}
                  >
                    Photo saved to this tasting
                  </span>
                  <h2
                    className="f-disp"
                    style={{
                      margin: "0",
                      fontSize: "23px",
                      lineHeight: "1.1",
                      fontWeight: "800",
                    }}
                  >
                    {"Looks like "}
                    {v.guessName}.
                  </h2>
                  <p
                    style={{ margin: "0", fontSize: "13px", color: "#5E4E49" }}
                  >
                    Reading labels is the camera’s job. Tasting is yours.
                  </p>
                  <button
                    className="press"
                    onClick={v.acceptGuess}
                    style={{
                      height: "58px",
                      borderRadius: "18px",
                      border: "1.5px solid #1E1416",
                      background: "#F2CF5B",
                      fontWeight: "700",
                      fontSize: "16px",
                    }}
                  >
                    That’s it
                  </button>
                  <button
                    onClick={v.rejectGuess}
                    style={{
                      height: "52px",
                      borderRadius: "18px",
                      border: "1.5px solid #1E1416",
                      background: "transparent",
                      fontWeight: "600",
                      fontSize: "15px",
                    }}
                  >
                    Not quite. Keep the photo anyway
                  </button>
                </div>
              </>
            ) : null}
          </section>
        </>
      ) : null}
      {/* TOAST */}
      {v.hasToast ? (
        <>
          {" "}
          <div
            role="status"
            className="drop"
            style={{
              position: "absolute",
              left: "50%",
              top: "14px",
              transform: "translateX(-50%)",
              zIndex: "60",
              background: "#1E1416",
              color: "#FBF6EA",
              padding: "10px 16px",
              borderRadius: "22px",
              fontSize: "13.5px",
              fontWeight: "600",
              whiteSpace: "nowrap",
            }}
          >
            {v.toast}
          </div>
        </>
      ) : null}
      {overlay}
    </div>
  );
}
