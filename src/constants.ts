import IconEnvelope from "@phosphor-icons/core/assets/regular/envelope.svg";
import IconFacebook from "@phosphor-icons/core/assets/regular/facebook-logo.svg";
import IconGitHub from "@phosphor-icons/core/assets/regular/github-logo.svg";
import IconLinkedin from "@phosphor-icons/core/assets/regular/linkedin-logo.svg";
import IconPinterest from "@phosphor-icons/core/assets/regular/pinterest-logo.svg";
import IconTelegram from "@phosphor-icons/core/assets/regular/telegram-logo.svg";
import IconWhatsapp from "@phosphor-icons/core/assets/regular/whatsapp-logo.svg";
import IconBrandX from "@phosphor-icons/core/assets/regular/x-logo.svg";
import type { Props } from "astro";
import { SITE } from "@/config";

interface Social {
	name: string;
	href: string;
	linkTitle: string;
	icon: (_props: Props) => Element;
}

export const SOCIALS: Social[] = [
	{
		name: "GitHub",
		href: "https://github.com/jschraub/dev-wisdom",
		linkTitle: `${SITE.title} on GitHub`,
		icon: IconGitHub,
	},
	// {
	//   name: "X",
	//   href: "https://x.com/username",
	//   linkTitle: `${SITE.title} on X`,
	//   icon: IconBrandX,
	// },
	{
		name: "LinkedIn",
		href: "https://www.linkedin.com/in/jared-schraub-41741025/",
		linkTitle: `${SITE.title} on LinkedIn`,
		icon: IconLinkedin,
	},
	{
		name: "Mail",
		href: "mailto:jaredschraub@outlook.com",
		linkTitle: `Send an email to ${SITE.title}`,
		icon: IconEnvelope,
	},
] as const;

export const SHARE_LINKS: Social[] = [
	{
		name: "WhatsApp",
		href: "https://wa.me/?text=",
		linkTitle: `Share this post via WhatsApp`,
		icon: IconWhatsapp,
	},
	{
		name: "Facebook",
		href: "https://www.facebook.com/sharer.php?u=",
		linkTitle: `Share this post on Facebook`,
		icon: IconFacebook,
	},
	{
		name: "X",
		href: "https://x.com/intent/post?url=",
		linkTitle: `Share this post on X`,
		icon: IconBrandX,
	},
	{
		name: "Telegram",
		href: "https://t.me/share/url?url=",
		linkTitle: `Share this post via Telegram`,
		icon: IconTelegram,
	},
	{
		name: "Pinterest",
		href: "https://pinterest.com/pin/create/button/?url=",
		linkTitle: `Share this post on Pinterest`,
		icon: IconPinterest,
	},
	{
		name: "Mail",
		href: "mailto:?subject=See%20this%20post&body=",
		linkTitle: `Share this post via email`,
		icon: IconEnvelope,
	},
] as const;
