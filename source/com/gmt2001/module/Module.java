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
package com.gmt2001.module;

import tv.phantombot.event.Event;
import tv.phantombot.event.command.CommandEvent;
import tv.phantombot.event.discord.channel.DiscordChannelCommandEvent;
import tv.phantombot.event.irc.message.IrcModerationEvent;

/**
 * A bot module written in Java
 *
 * @author gmt2001
 */
public abstract class Module {
    /**
     * Current enabled state
     */
    private boolean isEnabled = false;

    /**
     * Executes immediately after loading this module
     */
    public void onLoad() {}

    /**
     * Executes after all models have been loaded
     */
    public void afterLoad() {}

    /**
     * Indicates the default enabled state of the module on a new installation
     *
     * @return {@code true} if the module should be enabled
     */
    public boolean defaultEnabledState() {
        return false;
    }

    /**
     * Indicates if this module is currently enabled
     *
     * @return {@code true} if enabled
     */
    public final boolean isEnabled() {
        return this.isEnabled;
    }

    /**
     * Executes when the module state changes to enabled
     * <p>
     * Also executes after {@link #afterLoad()} if the initialization state of the module is enabled
     */
    public void onEnable() {
        this.isEnabled = true;
    }

    /**
     * Executes when the module state changes to disabled
     * <p>
     * Also executes after {@link #afterLoad()} if the initialization state of the module is disabled
     */
    public void onDisable() {
        this.isEnabled = false;
    }

    /**
     * Receives all events except for {@link IrcModerationEvent}, {@link CommandEvent}, and {@link DiscordChannelCommandEvent}
     *
     * @param event the event data
     */
    public void onEvent(Event event) {}

    /**
     * Receives {@link IrcModerationEvent}
     *
     * @param event the event data
     */
    public void onIRCModerationEvent(IrcModerationEvent event) {}

    /**
     * Receives {@link CommandEvent}
     * <p>
     * If {@code false} is returned, command cost/reward are undone
     *
     * @param event the event data
     * @return {@code true} if the command was handled successfully
     */
    public boolean onCommandEvent(CommandEvent event) {
        return false;
    }

    /**
     * Receives {@link DiscordChannelCommandEvent}
     * <p>
     * If {@code false} is returned, command cost/reward are undone
     *
     * @param event the event data
     * @return {@code true} if the command was handled successfully
     */
    public boolean onDiscordChannelCommandEvent(DiscordChannelCommandEvent event) {
        return false;
    }
}
