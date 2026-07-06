import { readFileSync } from "node:fs";
import satori from "satori";
import { SITE } from "@/config";
import loadGoogleFonts from "../loadGoogleFont";
import { OG } from "./palette";

// The signed-off brand mark, embedded so shared links carry it verbatim.
const mark = `data:image/svg+xml;base64,${Buffer.from(
	readFileSync(new URL("../../../public/favicon.svg", import.meta.url)),
).toString("base64")}`;

export default async (post) => {
	return satori(
		{
			type: "div",
			props: {
				style: {
					display: "flex",
					flexDirection: "column",
					width: "100%",
					height: "100%",
					background: OG.background,
					color: OG.foreground,
				},
				children: [
					// Brand signature: the accent rule across the top.
					{
						type: "div",
						props: {
							style: {
								height: "12px",
								width: "100%",
								background: OG.accent,
							},
						},
					},
					{
						type: "div",
						props: {
							style: {
								display: "flex",
								flexDirection: "column",
								justifyContent: "space-between",
								flexGrow: 1,
								padding: "56px 72px 56px",
							},
							children: [
								// Brand row: mark + hostname.
								{
									type: "div",
									props: {
										style: {
											display: "flex",
											alignItems: "center",
											gap: "14px",
										},
										children: [
											{
												type: "img",
												props: {
													src: mark,
													width: 30,
													height: 30,
												},
											},
											{
												type: "span",
												props: {
													style: { fontSize: 28, color: OG.muted },
													children: new URL(SITE.website).hostname,
												},
											},
										],
									},
								},
								// Title.
								{
									type: "div",
									props: {
										style: {
											display: "flex",
											maxHeight: "63%",
											overflow: "hidden",
										},
										children: {
											type: "p",
											props: {
												style: {
													fontSize: 64,
													fontWeight: 600,
													lineHeight: 1.18,
													letterSpacing: "-0.01em",
													margin: 0,
												},
												children: post.data.title,
											},
										},
									},
								},
								// Attribution row: author left, tagline right.
								{
									type: "div",
									props: {
										style: {
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											width: "100%",
											fontSize: 28,
										},
										children: [
											{
												type: "span",
												props: {
													style: { color: OG.muted },
													children: `by ${post.data.author}`,
												},
											},
											{
												type: "span",
												props: {
													style: { color: OG.accent, fontWeight: 600 },
													children: SITE.tagline,
												},
											},
										],
									},
								},
							],
						},
					},
				],
			},
		},
		{
			width: 1200,
			height: 630,
			embedFont: true,
			fonts: await loadGoogleFonts(
				`${post.data.title}${post.data.author}${SITE.tagline}${new URL(SITE.website).hostname}by `,
			),
		},
	);
};
