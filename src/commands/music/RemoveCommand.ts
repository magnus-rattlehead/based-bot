import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import { IQueueSong } from "../../typings";
import i18n from "../../config";
import { AudioPlayerPlayingState } from "@discordjs/voice";
import { GuildMember } from "discord.js";

export class RemoveCommand extends BaseCommand {
    public constructor(client: BaseCommand["client"]) {
        super(client, {
            aliases: ["r", "delete"],
            description: i18n.__("commands.music.remove.description"),
            name: "remove",
            slash: {
                options: []
            },
            usage: "{prefix}remove"
        });
    }

    public async execute(ctx: CommandContext): Promise<Message|void> {
        if (!inVC(ctx)) return;
        if (!haveQueue(ctx)) return;
        if (!sameVC(ctx)) return;
        
        const djRole = await this.client.utils.fetchDJRole(ctx.guild!);
        if (!ctx.member?.roles.cache.has(djRole.id) && !ctx.member?.permissions.has("MANAGE_GUILD")) return ctx.reply({ embeds: [createEmbed("error", "You don't have permission to remove.", true)] });

        const targetType = (ctx.args[0] as string | undefined) ?? ctx.options?.getSubcommand() ?? ctx.options?.getNumber("position");
        if (!targetType) return ctx.reply({ embeds: [createEmbed("warn", i18n.__mf("reusable.invalidUsage", { prefix: `${this.client.config.mainPrefix}help`, name: `${this.meta.name}` }))] });

        const songs = [...ctx.guild!.queue!.songs.sortByIndex().values()];
        if (!["first", "last"].includes(String(targetType).toLowerCase()) && (isNaN(Number(targetType)) || Number(targetType) <= 0 || Number(targetType) > songs.length || !songs[Number(targetType) - 1])) return ctx.reply({ embeds: [createEmbed("error", "Non-existent song index", true)] });

        let song: IQueueSong;
        if (String(targetType).toLowerCase() === "first") {
            song = songs[0];
        } else if (String(targetType).toLowerCase() === "last") {
            song = songs[songs.length - 1];
        } else {
            song = songs[Number(targetType) - 1];
        }
        
        if (song.key === ((ctx.guild!.queue!.player!.state as AudioPlayerPlayingState).resource.metadata as IQueueSong).key) return ctx.reply({ embeds: [createEmbed("error", "Can't remove currently playing song", true)] });

        ctx.guild?.queue?.songs.removeSong(song);

        void ctx.reply({ embeds: [createEmbed("success", `⏭ **|** ${i18n.__mf("commands.music.remove.removeMessage", { song: `[${song.song.title}](${song.song.url}})` })}`).setThumbnail(song.song.thumbnail)] }).catch(e => this.client.logger.error("REMOVE_CMD_ERR:", e));
    }
}
