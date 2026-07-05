import type { CollectionEntry } from "astro:content";
import { SITE } from "@/config";

const postFilter = ({ data }: CollectionEntry<"blog">) => {
	const isPublishTimePassed =
		Date.now() >
		new Date(data.pubDatetime).getTime() - SITE.scheduledPostMargin;

	// In dev, surface everything — including drafts and scheduled posts — so the
	// author can preview them locally. Drafts are clearly marked with a badge.
	if (import.meta.env.DEV) return true;

	// In production, drafts and not-yet-published posts are hidden from every
	// listing (home, pagination, archives, tags, search index, RSS). Draft pages
	// are still built at their own URL so they can be shared via a secret link.
	return !data.draft && isPublishTimePassed;
};

export default postFilter;
