/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package com.gmt2001.modules;

import tv.phantombot.event.Event;
import tv.phantombot.event.command.CommandEvent;
import tv.phantombot.event.discord.channel.DiscordChannelCommandEvent;
import tv.phantombot.event.irc.message.IrcModerationEvent;

/**
 * A bot module written in Java
 *
 * @author gmt2001
 */
public interface Module {
    /**
     * Executes immediately after loading this module
     */
    default void onLoad() {}

    /**
     * Executes after all models have been loaded
     */
    default void afterLoad() {}

    /**
     * Indicates the default enabled state of the module on a new installation
     *
     * @return {@code true} if the module should be enabled
     */
    default boolean defaultEnabledState() {
        return false;
    }

    /**
     * Executes when the module state changes to enabled
     * <p>
     * Also executes after {@link #afterLoad()} if the initialization state of the module is enabled
     */
    default void onEnable() {}

    /**
     * Executes when the module state changes to disabled
     * <p>
     * Also executes after {@link #afterLoad()} if the initialization state of the module is disabled
     */
    default void onDisable() {}

    /**
     * Receives all events except for {@link IrcModerationEvent}, {@link CommandEvent}, and {@link DiscordChannelCommandEvent}
     *
     * @param event the event data
     */
    default void onEvent(Event event) {}

    /**
     * Receives {@link IrcModerationEvent}
     *
     * @param event the event data
     */
    default void onIRCModerationEvent(IrcModerationEvent event) {}

    /**
     * Receives {@link CommandEvent}
     *
     * @param event the event data
     */
    default void onCommandEvent(CommandEvent event) {}

    /**
     * Receives {@link DiscordChannelCommandEvent}
     *
     * @param event the event data
     */
    default void onDiscordChannelCommandEvent(DiscordChannelCommandEvent event) {}
}
