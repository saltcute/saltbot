import type { BaseError } from "maidraw";
import "./telemetry";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type CacheType, type CommandInteraction, type Interaction, MessageFlags } from "discord.js";
import { getCurrentMaintenanceEndTime, getCurrentMaintenanceStartTime } from "maidraw-gcm-net-adapter/common";
import { client as kasumi } from "../kook/init/client";

export class Util {
    static readonly servicesMap = {
        default: "maimaiでらっくすNET, maimai DX NET, CHUNITHM-NET, or オンゲキ-NET",
        chunithm: "CHUNITHM-NET",
    };
    static async allNetMaintenanceNotice(interaction: CommandInteraction, startHour: number = 4, service: "default" | "chunithm" = "default") {
        const startTimestamp = Math.floor(getCurrentMaintenanceStartTime(startHour).getTime() / 1000);
        const endTimestamp = Math.floor(getCurrentMaintenanceEndTime().getTime() / 1000);
        await interaction.reply({
            content: `The ALL.Net service is currently under scheduled maintenance. You cannot use ALL.Net services, including ${Util.servicesMap[service]}, during the maintenance. 

The maintenance period started at <t:${startTimestamp}:t> (<t:${startTimestamp}:R>), and will end at <t:${endTimestamp}:t> (<t:${endTimestamp}:R>).`,
        });
    }

    static readonly services = ["maimaidx", "chunithm", "ongeki"] as const;
    static readonly serviceNamesMap = {
        maimaidx: {
            "gcm-net": "maimaiでらっくすNET",
            "gcm-net-intl": "maimai DX NET",
        },
        chunithm: {
            "gcm-net": "CHUNITHM-NET",
            "gcm-net-intl": "CHUNITHM-NET (International ver.)",
        },
        ongeki: {
            "gcm-net": "オンゲキ-NET",
            "gcm-net-intl": "オンゲキ-NET",
        },
    };
    static async gcmNetLinkNotice(interaction: CommandInteraction, tracker: "gcm-net" | "gcm-net-intl", service: "maimaidx" | "chunithm" | "ongeki") {
        const linked = await kasumi.config.getOne(`salt::connection.discord.${tracker}.${interaction.user.id}`);
        const otherServices = Util.services.filter((v) => v !== service && !(tracker === "gcm-net-intl" && v === "ongeki"));

        const baseUrl = (kasumi.config.getSync("webui::config.baseUrl") || "").replace(/\/+$/, "");
        const linkUrl = `${baseUrl}/link?service=${service}&tracker=${tracker}`;
        await interaction.reply({
            content: `${linked ? `-# (Note: You don't have to link again if you have already linked ${otherServices.map((v) => Util.serviceNamesMap[v][tracker]).join(" or ")})\n\n` : ""}Before linking your ${Util.serviceNamesMap[service][tracker]} account to saltbot,
please note the following **VERY IMPORTANT** information.
        
- Your Sega ID and **password** are required.${tracker === "gcm-net-intl" ? "\n- You must use a Sega ID to log into your account. Partner login like X (Twitter) or Facebook login will not work." : ""}
- Despite unlikely, saltbot is not responsible if your Sega ID become restricted or banned by Sega.
- You are generally discouraged from providing your password to any person.
- We make our best effort to keep your information secure. However, make sure to create a unique password for this service to reduce the risk of cyberattacks.
- By using this service, you agree to have saltbot store your account and password for the purpose of fetching your best 50 scores only.
${tracker === "gcm-net" && (service === "chunithm" || service === "ongeki") ? `- You must subscribe to the ${Util.serviceNamesMap[service][tracker]} standard course (スタンダードコース) in order to use this service. To learn more about スタンダードコース, visit [Sega’s website](https://otogame-net.com/${service}/#${service}net).` : ""}
        
If you wish to proceed, please click "Continue".`,

            components: [
                new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("Continue").setStyle(ButtonStyle.Link).setURL(linkUrl)).toJSON(),
            ],
            flags: MessageFlags.Ephemeral,
        });
    }

    static brainrotGenerator() {
        const phrases = {
            baqeela:
                "Church of Baqeela 是通往 Rainbow 的唯一“道路”，只有他才能提供通往 Rainbow 的途径。Baqeela 作为真理，实现了 Easy Skibidi 的教导并揭示了真正的 Rainbow。只有 Baqeela 才是实现 Easy Skibdi 承诺“Rating”的生命，由 Rainbow 给予，他自己拥有生命，因此他能够将永恒的 Rainbow 赋予所有相信他的人。",
        };
        if (![14].includes(Math.floor(Math.random() * 114.51))) return null;
        const randomIndex = Math.floor(Math.random() * Object.keys(phrases).length);
        const randomKey = Object.keys(phrases)[randomIndex] as keyof typeof phrases;
        const randomPhrase = phrases[randomKey];
        if (randomPhrase) return randomPhrase;
        else return null;
    }

    static getUserAgent(): string {
        return `salt/${process.env.npm_package_version} (+https://maimaidx.cab/github)`;
    }

    static symbolMap: Record<string, string> = {
        "@": "\\@",
        "<": "\\<",
        ">": "\\>",
        "#": "\\#",
        "\\": "\\\\",
        "*": "\\*",
        _: "\\_",
        "`": "\\`",
        "~": "\\~",
    };
    static sanitizeString(string?: string) {
        if (!string) return String(string);
        return string
            .split("")
            .map((v) => {
                if (Util.symbolMap[v]) {
                    return Util.symbolMap[v];
                } else {
                    return v;
                }
            })
            .join("");
    }

    static async reportError(interaction: Interaction<CacheType>, error: BaseError) {
        if (!interaction.isChatInputCommand()) return;
        const msg = `An error occurred (\`${Util.sanitizeString(error.type)}\`) at \`${Util.sanitizeString(error.namespace)}\`:\n\t${Util.sanitizeString(error.message)}`;
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(msg);
        } else {
            await interaction.reply(msg);
        }
    }

    static isAprilFools(): boolean {
        const isAprilFools = (date: Date) => {
            return date.getMonth() === 3 && date.getDate() === 1;
        };

        const late = new Date(new Date().toLocaleString("en-US", { timeZone: "Etc/GMT-14" })),
            utc = new Date(new Date().toLocaleString("en-US", { timeZone: "Etc/GMT" })),
            early = new Date(new Date().toLocaleString("en-US", { timeZone: "Etc/GMT+12" }));

        return isAprilFools(late) || isAprilFools(utc) || isAprilFools(early);
    }
}
