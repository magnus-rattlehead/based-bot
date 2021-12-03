import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import { IQueueSong } from "../../typings";
import i18n from "../../config";
import { AudioPlayerPlayingState } from "@discordjs/voice";
import { GuildMember } from "discord.js";

export class ClearCommand extends BaseCommand {
    public constructor(client: BaseCommand["client"]) {
        super(client, {
            aliases: ["c"],
            description: i18n.__("commands.music.remove.description"),
            name: "clear",
            slash: {
                options: []
            },
            usage: "{prefix}clear"
        });
    }

    public async execute(ctx: CommandContext): Promise<void> {
        if (!inVC(ctx)) return;
        if (!haveQueue(ctx)) return;
        if (!sameVC(ctx)) return;
        
        const djRole = await this.client.utils.fetchDJRole(ctx.guild!);
        if (!ctx.member?.roles.cache.has(djRole.id) && !ctx.member?.permissions.has("MANAGE_GUILD")) return ctx.reply({ embeds: [createEmbed("error", "You don't have permission to clear.", true)] });

        const songs = [...ctx.guild!.queue!.songs.sortByIndex().values()];
        var removed:number = 0;
        for(song in songs) { 
            if (song.key === ((ctx.guild!.queue!.player!.state as AudioPlayerPlayingState).resource.metadata as IQueueSong).key) continue;

            ctx.guild?.queue?.songs.removeSong(song);
            removed++;
        }

        void ctx.reply({ embeds: [createEmbed("success", `⏭ **|** ${i18n.__mf("commands.music.clear.clearMessage", { count: `${ removed }` })}`) }).catch(e => this.client.logger.error("CLEAR_CMD_ERR:", e));
    }
}
