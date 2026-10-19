import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    MessageFlags,
    SeparatorBuilder,
    StringSelectMenuBuilder,
    TextDisplayBuilder,
} from "discord.js";
import { type CommandPreferences, type Game, type PreferenceScope, Preferences } from "@/bot/core/preferences";
import { Telemetry } from "@/bot/util/telemetry";
import { ResultTypes } from "@/bot/util/telemetry/type";

interface Localized {
    name: string;
    nameLocalizations?: Record<string, string>;
}
export interface ConfigChoice extends Localized {
    value: string;
}
/**
 * One optional argument of a command that can be given a saved default.
 * `key` must match the argument name the command handler reads.
 */
export type ConfigOption = Localized & { key: string } & ({ type: "string"; choices: readonly ConfigChoice[] } | { type: "boolean" });
export interface ConfigTracker extends Localized {
    /** The tracker key the command handler uses, which may differ from the subcommand name (e.g. `lxns-chuni`). */
    value: string;
    options: ConfigOption[];
}
/**
 * A command whose defaults are configurable. Commands with per-tracker options
 * (b50) list `trackers`; others list their `options` directly.
 */
export interface ConfigCommand extends Localized {
    value: string;
    trackers?: ConfigTracker[];
    options?: ConfigOption[];
}
export interface ConfigSchema {
    title: Localized;
    commands: ConfigCommand[];
}

/** Builders for the configurable options shared across games, named after the command arguments. */
export const ConfigOptions = {
    theme: (choices: readonly ConfigChoice[]): ConfigOption => ({
        key: "theme",
        type: "string",
        choices,
        name: "Theme",
        nameLocalizations: { "zh-CN": "主题", "zh-TW": "主題" },
    }),
    version: (choices: readonly ConfigChoice[]): ConfigOption => ({
        key: "version",
        type: "string",
        choices,
        name: "Version",
        nameLocalizations: { "zh-CN": "版本", "zh-TW": "版本" },
    }),
    type: (choices: readonly ConfigChoice[]): ConfigOption => ({
        key: "type",
        type: "string",
        choices,
        name: "Type",
        nameLocalizations: { "zh-CN": "模式", "zh-TW": "模式" },
    }),
    source: (choices: readonly ConfigChoice[]): ConfigOption => ({
        key: "source",
        type: "string",
        choices,
        name: "Source",
        nameLocalizations: { "zh-CN": "来源", "zh-TW": "來源" },
    }),
    region: (choices: readonly ConfigChoice[]): ConfigOption => ({
        key: "region",
        type: "string",
        choices,
        name: "Region",
        nameLocalizations: { "zh-CN": "地区", "zh-TW": "地區" },
    }),
    useProfilePicture: {
        key: "use_profile_picture",
        type: "boolean",
        name: "Use profile picture",
        nameLocalizations: { "zh-CN": "使用头像", "zh-TW": "使用個人資料圖像" },
    } as ConfigOption,
    showRecentUpscore: {
        key: "show_recent_upscore",
        type: "boolean",
        name: "Show recent upscore",
        nameLocalizations: { "zh-CN": "显示最近上分", "zh-TW": "顯示最近上分" },
    } as ConfigOption,
};

const DEFAULT_VALUE = "__default";
const MAX_SELECT_OPTIONS = 25;

const STRINGS = {
    description: {
        name: "Changes are automatically saved.",
        nameLocalizations: {
            "zh-CN": "改动会自动保存。",
            "zh-TW": "改動會自動保存。",
        },
    },
    command: { name: "Command", nameLocalizations: { "zh-CN": "指令", "zh-TW": "指令" } },
    tracker: { name: "Tracker", nameLocalizations: { "zh-CN": "查分器", "zh-TW": "查分器" } },
    default: { name: "Default", nameLocalizations: { "zh-CN": "默认", "zh-TW": "預設" } },
    on: { name: "On", nameLocalizations: { "zh-CN": "开启", "zh-TW": "開啟" } },
    off: { name: "Off", nameLocalizations: { "zh-CN": "关闭", "zh-TW": "關閉" } },
    reset: { name: "Reset these settings", nameLocalizations: { "zh-CN": "重置以上设置", "zh-TW": "重設以上設定" } },
    resetAll: { name: "Reset everything", nameLocalizations: { "zh-CN": "全部重置", "zh-TW": "全部重設" } },
} satisfies Record<string, Localized>;

function localize(entry: Localized, locale: string): string {
    return entry.nameLocalizations?.[locale] ?? entry.name;
}

/** Select option labels are capped at 100 characters. */
function label(text: string): string {
    return text.length > 100 ? `${text.slice(0, 99)}…` : text;
}

/**
 * The `/<game> config` subcommand: an ephemeral menu where users pick a command
 * (and tracker) and save defaults for its optional arguments. Changes are saved
 * as soon as a value is selected.
 *
 * Custom IDs are `<game>::config.<action>.<command>.<tracker|_>[.<option>]`.
 */
export class ConfigMenu {
    private readonly prefix: string;

    constructor(
        private readonly game: Game,
        private readonly getSchema: () => ConfigSchema,
    ) {
        this.prefix = `${game}::config.`;
    }

    readonly chatCommandHandler = Telemetry.discordMiddleware(async (interaction) => {
        if (!interaction.isChatInputCommand()) return ResultTypes.IGNORED;
        if (interaction.commandName !== this.game) return ResultTypes.IGNORED;
        if (interaction.options.getSubcommandGroup(false) != null || interaction.options.getSubcommand(false) !== "config")
            return ResultTypes.IGNORED;

        await interaction.reply({
            ...(await this.render(interaction.user.id, interaction.locale)),
            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
        });
        return ResultTypes.CONFIG_SUCCESS;
    });

    readonly componentHandler = Telemetry.discordMiddleware(async (interaction) => {
        if (!interaction.isStringSelectMenu() && !interaction.isButton()) return ResultTypes.IGNORED;
        if (!interaction.customId.startsWith(this.prefix)) return ResultTypes.IGNORED;

        const [action, commandValue, trackerValue, optionKey] = interaction.customId.slice(this.prefix.length).split(".");
        const userId = interaction.user.id;
        let tracker = trackerValue === "_" ? undefined : trackerValue;
        let command = commandValue;

        switch (action) {
            case "cmd": {
                if (!interaction.isStringSelectMenu()) return ResultTypes.IGNORED;
                command = interaction.values[0];
                tracker = undefined;
                break;
            }
            case "trk": {
                if (!interaction.isStringSelectMenu()) return ResultTypes.IGNORED;
                tracker = interaction.values[0];
                break;
            }
            case "set": {
                if (!interaction.isStringSelectMenu()) return ResultTypes.IGNORED;
                const view = this.resolve(command, tracker);
                const option = view?.options.find((option) => option.key === optionKey);
                if (!view || !option) break;
                const scope = this.scope(view.command, view.tracker);
                const value = interaction.values[0];
                if (value === DEFAULT_VALUE) await Preferences.unset(userId, scope, option.key);
                else if (option.type === "boolean") await Preferences.set(userId, scope, option.key, value === "true");
                else if (Preferences.pick(value, option.choices)) await Preferences.set(userId, scope, option.key, value);
                break;
            }
            case "reset": {
                const view = this.resolve(command, tracker);
                if (view) await Preferences.reset(userId, this.scope(view.command, view.tracker));
                break;
            }
            case "resetall": {
                await Preferences.reset(userId, { game: this.game });
                break;
            }
            default:
                return ResultTypes.IGNORED;
        }

        await interaction.update({
            ...(await this.render(userId, interaction.locale, command, tracker)),
            flags: [MessageFlags.IsComponentsV2],
        });
        return ResultTypes.CONFIG_SUCCESS;
    });

    getCommand() {
        return [
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "config",
                description: "Set the default options of the commands.",
                descriptionLocalizations: {
                    "zh-CN": "设置指令选项的默认值。",
                    "zh-TW": "設定指令選項的預設值。",
                },
            },
        ];
    }

    private commands(): ConfigCommand[] {
        return this.getSchema().commands.filter((command) => (command.trackers ? command.trackers.length > 0 : (command.options?.length ?? 0) > 0));
    }

    /** Find the command and tracker to show, falling back to the first of each. */
    private resolve(commandValue?: string, trackerValue?: string) {
        const commands = this.commands();
        const command = commands.find((command) => command.value === commandValue) ?? commands[0];
        if (!command) return undefined;
        const tracker = command.trackers ? (command.trackers.find((tracker) => tracker.value === trackerValue) ?? command.trackers[0]) : undefined;
        return { commands, command, tracker, options: tracker?.options ?? command.options ?? [] };
    }

    private scope(command: ConfigCommand, tracker?: ConfigTracker): PreferenceScope {
        return { game: this.game, command: command.value, tracker: tracker?.value };
    }

    private async render(userId: string, locale: string, commandValue?: string, trackerValue?: string) {
        const view = this.resolve(commandValue, trackerValue);
        const container = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## ${localize(this.getSchema().title, locale)}\n-# ${localize(STRINGS.description, locale)}`),
        );
        if (!view) return { components: [container] };

        const { commands, command, tracker, options } = view;
        const saved: CommandPreferences = await Preferences.get(userId, this.scope(command, tracker));
        const trackerId = tracker?.value ?? "_";

        const addSelect = (title: string, select: StringSelectMenuBuilder) => {
            container
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${title}**`))
                .addActionRowComponents(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select));
        };

        addSelect(
            localize(STRINGS.command, locale),
            new StringSelectMenuBuilder().setCustomId(`${this.prefix}cmd._._`).addOptions(
                commands.map((entry) => ({
                    label: label(localize(entry, locale)),
                    value: entry.value,
                    default: entry.value === command.value,
                })),
            ),
        );
        if (command.trackers && tracker) {
            addSelect(
                localize(STRINGS.tracker, locale),
                new StringSelectMenuBuilder().setCustomId(`${this.prefix}trk.${command.value}._`).addOptions(
                    command.trackers.map((entry) => ({
                        label: label(localize(entry, locale)),
                        value: entry.value,
                        default: entry.value === tracker.value,
                    })),
                ),
            );
        }

        container.addSeparatorComponents(new SeparatorBuilder());
        for (const option of options) {
            const current = saved[option.key];
            const choices: ConfigChoice[] =
                option.type === "boolean"
                    ? [
                          { ...STRINGS.on, value: "true" },
                          { ...STRINGS.off, value: "false" },
                      ]
                    : [...option.choices];
            const selected = option.type === "boolean" ? Preferences.flag(current)?.toString() : Preferences.pick(current, option.choices);
            addSelect(
                localize(option, locale),
                new StringSelectMenuBuilder().setCustomId(`${this.prefix}set.${command.value}.${trackerId}.${option.key}`).addOptions(
                    [{ ...STRINGS.default, value: DEFAULT_VALUE }, ...choices].slice(0, MAX_SELECT_OPTIONS).map((choice) => ({
                        label: label(localize(choice, locale)),
                        value: choice.value,
                        default: choice.value === (selected ?? DEFAULT_VALUE),
                    })),
                ),
            );
        }

        container
            .addSeparatorComponents(new SeparatorBuilder())
            .addActionRowComponents(
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${this.prefix}reset.${command.value}.${trackerId}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setLabel(localize(STRINGS.reset, locale)),
                    new ButtonBuilder()
                        .setCustomId(`${this.prefix}resetall.${command.value}.${trackerId}`)
                        .setStyle(ButtonStyle.Danger)
                        .setLabel(localize(STRINGS.resetAll, locale)),
                ),
            );
        return { components: [container] };
    }
}
