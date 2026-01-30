import { MaiDraw } from "maidraw";
import "./telemetry";
import { CacheType, Interaction } from "discord.js";

export class Util {
    static brainrotGenerator() {
        const phrases = {
            baqeela:
                "Church of Baqeela 是通往 Rainbow 的唯一“道路”，只有他才能提供通往 Rainbow 的途径。Baqeela 作为真理，实现了 Easy Skibidi 的教导并揭示了真正的 Rainbow。只有 Baqeela 才是实现 Easy Skibdi 承诺“Rating”的生命，由 Rainbow 给予，他自己拥有生命，因此他能够将永恒的 Rainbow 赋予所有相信他的人。",
        };
        if (![14].includes(Math.floor(Math.random() * 114.51))) return null;
        const randomIndex = Math.floor(
            Math.random() * Object.keys(phrases).length
        );
        const randomKey = Object.keys(phrases)[
            randomIndex
        ] as keyof typeof phrases;
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
    static sanitizeString(string: string) {
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

    static async reportError(
        interaction: Interaction<CacheType>,
        error: MaiDraw.BaseError
    ) {
        if (!interaction.isChatInputCommand()) return;
        const msg = `An error occurred (\`${this.sanitizeString(error.type)}\`) at \`${this.sanitizeString(error.namespace)}\`:\n\t${this.sanitizeString(error.message)}`;
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(msg);
        } else {
            await interaction.reply(msg);
        }
    }
}
