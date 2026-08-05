import type { CollectionEntry } from "astro:content";
import { SITE } from "@/config";

/**
 * A post is published once it is not a draft and its pubDatetime has passed.
 * Both conditions hide it the same way, so use this instead of checking
 * `data.draft` — that alone misses scheduled posts. See ADR-0004.
 *
 * Runs at build time, not per request: a scheduled post appears at the next
 * build, not when its timestamp passes. scheduledPostMargin covers clock skew.
 */
export const isPublished = (data: CollectionEntry<"blog">["data"]) => {
	const isPublishTimePassed =
		Date.now() >
		new Date(data.pubDatetime).getTime() - SITE.scheduledPostMargin;
	return !data.draft && isPublishTimePassed;
};

const postFilter = ({ data }: CollectionEntry<"blog">) => {
	// In dev, surface everything — including drafts and scheduled posts — so the
	// author can preview them locally. Drafts are clearly marked with a badge.
	if (import.meta.env.DEV) return true;

	// In production, drafts are hidden from every listing (home, pagination,
	// archives, tags, search index, RSS). Their pages are still built at their
	// own URL so they can be shared via a secret link.
	return isPublished(data);
};

export default postFilter;
