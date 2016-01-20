/* 
 * Copyright (C) 2015 www.phantombot.net
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
package me.mast3rplan.phantombot.jerklib;

import java.util.*;

/**
 * This class allows you to probe various pieces of information about the
 * server. For more information see <a
 * href="http://tools.ietf.org/draft/draft-hardy-irc-isupport/draft-hardy-irc-isupport-00.txt">
 * this</a> and <a href="http://www.silen.eu.org/usr/irc/005.html">this</a>.
 * These documents will explain all the pieces of information provided through
 * this class.
 *
 * @author <a href="mailto:mohadib@openactive.org">Jason Davis</a>
 */
public class ServerInformation
{

    private String caseMapping = "", ircd = "", serverName = "";
    private String[] channelPrefixes, statusPrefixes, channelModes;
    private int maxChanNameLen, maxModesPerCommand, maxNickLen, maxSilenceListSize, maxTopicLen, maxAwayLen, maxKickLen, maxKeyLen, maxHostLen, maxUserLen;
    private boolean supportsCNotice, supportsCPrivMsg, supportsBanExceptions, supportsInviteExceptions;
    private boolean supportsSafeList, supportsStatusNotice, supportsCAPAB, supportsNickPrefixes, supportsSilenceList;
    private boolean supportsKnock, supportsWhox, supportsWallchops, supportsWallVoices, supportsUserIP, supportsEtrace;
    private final Map<String, Integer> joinLimits = new HashMap<>();
    private final Map<String, String> nickPrefixMap = new LinkedHashMap<>();
    private final Map<String, ModeType> modeMap = new HashMap<>();

    /**
     * <p>
     * <ul> <li> Type A: Modes that must add or remove an address to or from a
     * list. These modes <b>MUST</b> always have a parameter when sent from the
     * server to a client. A client MAY issue the mode without an argment to
     * obtain the current contents of the list. </li> <li> Type B: modes that
     * change a setting on a channel. These modes <b>MUST</b> always have a
     * parameter,</li>
     * <p/>
     * <li>Type C: modes that change a setting on a channel. These modes
     * <b>MUST</b> have a parameter when being set, and <b>MUST NOT</b> and mUST
     * NOT have a parameter when being unset. </li> <li> Type D: Modes that
     * change a setting on a channel. These modes <b>MUST</b> NOT have a
     * parameter.</li> </ul> </p> .
     */
    public enum ModeType
    {

        GROUP_A,
        GROUP_B,
        GROUP_C,
        GROUP_D,
        CUSTOM,
        ALL
    }

    public ServerInformation()
    {
        //init some defaults because some servers either dont send 005
        //or some events that need serverinformation to parse might happen before 005

        channelPrefixes = new String[]
        {
            "#", "&", "!", "+"
        };
        nickPrefixMap.put("@", "o");
        nickPrefixMap.put("%", "h");
        nickPrefixMap.put("+", "v");
        modeMap.put("o", ModeType.GROUP_A);//XXX Twitch.tv Override
    }

    /*
     * :irc.nixgeeks.com 005 mohadib CMDS=KNOCK,MAP,DCCALLOW,USERIP SAFELIST HCN
     * MAXCHANNELS=20 CHANLIMIT=#:20 MAXLIST=b:60,e:60,I:60 NICKLEN=30
     * CHANNELLEN=32 TOPICLEN=307 KICKLEN=307 AWAYLEN=307 MAXTARGETS=20
     * WALLCHOPS :are supported by this server :irc.nixgeeks.com 005 mohadib
     * WATCH=128 SILENCE=15 MODES=12 CHANTYPES=# PREFIX=(qaohv)~&@%+
     * CHANMODES=beI,kfL,lj,psmntirRcOAQKVGCuzNSMTG NETWORK=NixGeeks
     * CASEMAPPING=ascii EXTBAN=~,cqnr ELIST=MNUCT STATUSMSG=~&@%+ EXCEPTS INVEX
     * :are supported by this server :swiftco.wa.us.dal.net 005 r0bby_
     * NETWORK=DALnet SAFELIST MAXBANS=200 MAXCHANNELS=20 CHANNELLEN=32
     * KICKLEN=307 NICKLEN=30 TOPICLEN=307 MODES=6 CHANTYPES=# CHANLIMIT=#:20
     * PREFIX=(ov)@+ STATUSMSG=@+ :are available on this server
     * :swiftco.wa.us.dal.net 005 r0bby_ CASEMAPPING=ascii WATCH=128 SILENCE=10
     * ELIST=cmntu EXCEPTS INVEX CHANMODES=beI,k,jl,cimMnOprRst
     * MAXLIST=b:200,e:100,I:100
     * TARGMAX=DCCALLOW:,JOIN:,KICK:4,KILL:20,NOTICE:20,PART:,PRIVMSG:20,WHOIS:,WHOWAS:
     * :are available on this server :Vancouver.BC.CA.Undernet.org 005 r0bby___
     * MAXNICKLEN=15 TOPICLEN=160 AWAYLEN=160 KICKLEN=160 CHANNELLEN=200
     * MAXCHANNELLEN=200 CHANTYPES=#& PREFIX=(ov)@+ STATUSMSG=@+
     * CHANMODES=b,k,l,imnpstrDd CASEMAPPING=rfc1459 NETWORK=UnderNet :are
     * supported by this server :Vancouver.BC.CA.Undernet.org 005 r0bby___ WHOX
     * WALLCHOPS WALLVOICES USERIP CPRIVMSG CNOTICE SILENCE=15 MODES=6
     * MAXCHANNELS=10 MAXBANS=45 NICKLEN=12 :are supported by this server
     * :kubrick.freenode.net 005 BigDaddy IRCD=dancer CAPAB CHANTYPES=# EXCEPTS
     * INVEX CHANMODES=bdeIq,k,lfJD,cgijLmnPQrRstz CHANLIMIT=#:20 PREFIX=(ov)@+
     * MAXLIST=bdeI:50 MODES=4 STATUSMSG=@ KNOCK NICKLEN=16 :are supported by
     * this server :kubrick.freenode.net 005 BigDaddy SAFELIST CASEMAPPING=ascii
     * CHANNELLEN=30 TOPICLEN=450 KICKLEN=450 KEYLEN=23 USERLEN=10 HOSTLEN=63
     * SILENCE=50 :are supported by this server
     */
    public void parseServerInfo(String rawData)
    {
        String[] tokens = rawData.split("\\s+");
        serverName = tokens[0].substring(1);

        for (int i = 3; i < tokens.length; i++)
        {
            String[] subTokens = tokens[i].split("=");
            if (subTokens[0].equals("IRCD"))
            {
                ircd = subTokens[1];
            } else if (subTokens[0].equals("	"))
            {
                supportsCAPAB = true;
            } else if (subTokens[0].equals("CHANTYPES") && subTokens.length == 2)
            {
                String[] data = subTokens[1].split("");
                channelPrefixes = new String[data.length - 1];
                System.arraycopy(data, 1, channelPrefixes, 0, data.length - 1);
            } else if (subTokens[0].equals("EXCEPTS"))
            {
                supportsBanExceptions = true;
            } else if (subTokens[0].equals("INVEX"))
            {
                supportsInviteExceptions = true;
            } else if (subTokens[0].equals("SAFELIST"))
            {
                supportsSafeList = true;
            } else if (subTokens[0].equals("CASEMAPPING"))
            {
                caseMapping = subTokens[1];
            } else if (subTokens[0].equals("CHANNELLEN"))
            {
                maxChanNameLen = Integer.parseInt(subTokens[1]);
            } else if (subTokens[0].equals("MAXCHANNELLEN"))
            {
                maxChanNameLen = Integer.parseInt(subTokens[1]);
            } else if (subTokens[0].equals("TOPICLEN"))
            {
                maxTopicLen = Integer.parseInt(subTokens[1]);
            } else if (subTokens[0].equals("AWAYLEN"))
            {
                maxAwayLen = Integer.parseInt(subTokens[1]);
            } else if (subTokens[0].equals("NICKLEN"))
            {
                maxNickLen = Integer.parseInt(subTokens[1]);
            } else if (subTokens[0].equals("MAXNICKLEN"))
            {
                maxNickLen = Integer.parseInt(subTokens[1]);
            } else if (subTokens[0].equals("KICKLEN"))
            {
                maxKickLen = Integer.parseInt(subTokens[1]);
            } else if (subTokens[0].equals("KEYLEN"))
            {
                maxKeyLen = Integer.parseInt(subTokens[1]);
            } else if (subTokens[0].equals("HOSTLEN"))
            {
                maxHostLen = Integer.parseInt(subTokens[1]);
            } else if (subTokens[0].equals("USERLEN"))
            {
                maxUserLen = Integer.parseInt(subTokens[1]);
            } else if (subTokens[0].equals("CNOTICE"))
            {
                supportsCNotice = true;
            } else if (subTokens[0].equals("CPRIVMSG"))
            {
                supportsCPrivMsg = true;
            } else if (subTokens[0].equals("KNOCK"))
            {
                supportsKnock = true;
            } else if (subTokens[0].equals("WHOX"))
            {
                supportsWhox = true;
            } else if (subTokens[0].equals("WALLCHOPS"))
            {
                supportsWallchops = true;
            } else if (subTokens[0].equals("WALLVOICES"))
            {
                supportsWallVoices = true;
            } else if (subTokens[0].equals("USERIP"))
            {
                supportsUserIP = true;
            } else if (subTokens[0].equals("ETRACE"))
            {
                supportsEtrace = true;
            } else if (subTokens[0].equals("SILENCE"))
            {
                if (subTokens.length == 2)
                {
                    supportsSilenceList = true;
                    maxSilenceListSize = Integer.parseInt(subTokens[1]);
                } else
                {
                    supportsSilenceList = false;
                }
            } else if (subTokens[0].equals("CHANLIMIT"))
            {
                String[] keyVals = subTokens[1].split(",");
                for (String keyVal : keyVals)
                {
                    String[] limits = keyVal.split(":");
                    String[] chanPrefixes = limits[0].split("");
                    int limit = -1;
                    if (limits.length == 2)
                    {
                        limit = Integer.parseInt(limits[1]);
                    }
                    for (String chanPrefix : chanPrefixes)
                    {
                        if (chanPrefix.matches(""))
                        {
                            continue;
                        }
                        joinLimits.put(chanPrefix, limit);
                    }
                }
            } else if (subTokens[0].equals("PREFIX"))
            {
                nickPrefixMap.clear();

                if (subTokens.length == 2)
                {
                    supportsNickPrefixes = true;
                    String[] modesAndPrefixes = subTokens[1].split("\\)");
                    modesAndPrefixes[0] = modesAndPrefixes[0].substring(1);
                    String[] modes = modesAndPrefixes[0].split("");
                    String[] prefixes = modesAndPrefixes[1].split("");
                    for (int x = 0; x < prefixes.length; x++)
                    {
                        if (prefixes[x].matches(""))
                        {
                            continue;
                        }
                        nickPrefixMap.put(prefixes[x], modes[x]);
                        modeMap.put(modes[x], ModeType.GROUP_B);
                    }
                }
            } else if (subTokens[0].equals("MODES"))
            {
                if (subTokens.length == 2)
                {
                    maxModesPerCommand = Integer.parseInt(subTokens[1]);
                }
            } else if (subTokens[0].equals("STATUSMSG"))
            {
                supportsStatusNotice = true;
                String[] tmp = subTokens[1].split("");
                statusPrefixes = new String[tmp.length - 1];
                System.arraycopy(tmp, 1, statusPrefixes, 0, tmp.length - 1);
            } else if (subTokens[0].equals("CHANMODES"))
            {
                String[] modeGroups = subTokens[1].split(",");
                for (int x = 0; x < modeGroups.length; x++)
                {
                    ModeType mt = ModeType.CUSTOM;
                    switch (x)
                    {
                        case 0:
                            mt = ModeType.GROUP_A;
                            break;
                        case 1:
                            mt = ModeType.GROUP_B;
                            break;
                        case 2:
                            mt = ModeType.GROUP_C;
                            break;
                        case 3:
                            mt = ModeType.GROUP_D;
                            break;
                    }

                    String[] modes = modeGroups[x].split("");
                    for (String mode : modes)
                    {
                        if (mode.equals(""))
                        {
                            continue;
                        }
                        modeMap.put(mode, mt);
                    }
                }
                channelModes = modeMap.keySet().toArray(new String[modeMap.size()]);
            } else
            {
                //com.gmt2001.Console.err.println("Unreconized Server Info Token:" + subTokens[0]);
            }
        }
    }

    /**
     * Get all modes of the given
     * {@link me.mast3rplan.phantombot.jerklib.ServerInformation.ModeType}.
     *
     * @param type - the mode type
     * @return an array containing all modes of the given type.
     * @see me.mast3rplan.phantombot.jerklib.ServerInformation.ModeType
     */
    public String[] getModes(ModeType type)
    {
        List<String> modesList = new ArrayList<>();
        for (String key : modeMap.keySet())
        {
            if (modeMap.get(key) == type || type == ModeType.ALL)
            {
                modesList.add(key);
            }
        }
        return modesList.toArray(new String[modesList.size()]);
    }

    /**
     * Get the
     * {@link me.mast3rplan.phantombot.jerklib.ServerInformation.ModeType} for
     * the given mode.
     *
     * @param mode the mode
     * @return the
     * {@link me.mast3rplan.phantombot.jerklib.ServerInformation.ModeType}.
     * @see me.mast3rplan.phantombot.jerklib.ServerInformation.ModeType
     */
    public ModeType getTypeForMode(String mode)
    {
        return modeMap.get(mode);
    }

    /**
     * Get the server name
     *
     * @return the name of the server
     */
    public String getServerName()
    {
        return serverName;
    }

    /**
     * Get the IRCD String (this will usually be the name of the ircd.
     *
     * @return the IRCD string.
     */
    public String getIrcdString()
    {
        return ircd;
    }

    /**
     * Get the case mapping used by this server.<br> Will be one of the
     * following: ascii, rfc1459, or strict-rfc1459
     *
     * @return the case mapping used by the server
     */
    public String getCaseMapping()
    {
        return caseMapping;
    }

    /**
     * Used to indicate the maximum amount of channels that a client may join of
     * a given prefix. A commen example prefix would be #
     *
     * @param prefix the channel prefix
     * @return the maximum join limit for the given channel prefix
     */
    public int getChannelJoinLimitForPrefix(String prefix)
    {
        return joinLimits.get(prefix);
    }

    /**
     * Retrieve all supported channel modes.
     *
     * @return the supported channel modes
     */
    public String[] getSupportedChannelModes()
    {
        return channelModes;
    }

    /**
     * Get whether or not the server supports CAPAB
     *
     * @return whether or not the server support CAPAB
     */
    public boolean supportsCAPAB()
    {
        return supportsCAPAB;
    }

    /**
     * Get whether or not CNOTICE are supported by the server.
     *
     * @return whether or not CNOTICE is supported by the server
     */
    public boolean supportsCNotice()
    {
        return supportsCNotice;
    }

    /**
     * Get whether or not the server supports CPRIVMSG
     *
     * @return whether or not the server supports CPRIVMSG
     */
    public boolean supportsCPrivMsg()
    {
        return supportsCPrivMsg;
    }

    /**
     * Get whether or not WHOX is supported,
     *
     * @return whether or not WHOX is supported.
     */
    public boolean supportsWhox()
    {
        return supportsWhox;
    }

    /**
     * Get if WALLCHOPS is supported.
     *
     * @return whether or not WALLCHOPS is supported.
     */
    public boolean supportsWallChops()
    {
        return supportsWallchops;
    }

    /**
     * Get whether or not WALLVOICES is supported.
     *
     * @return whether or not WALLVOICES is supported.
     */
    public boolean supportsWallVoices()
    {
        return supportsWallVoices;
    }

    /**
     * Get whether or not the server supports ban exceptions
     *
     * @return whether or not server supports ban exceptions.
     */
    public boolean supportsBanExceptions()
    {
        return supportsBanExceptions;
    }

    /**
     * Get whether or not Invite Exceptions are supported.
     *
     * @return whether or not invite are supported.
     */
    public boolean supportsInviteExceptions()
    {
        return supportsInviteExceptions;
    }

    /**
     * Get whether or not KNOCK is supported.
     *
     * @return whether or not KNOCK is supported
     */
    public boolean supportsKnock()
    {
        return supportsKnock;
    }

    /**
     * Get Whether or not USERIP is supported.
     *
     * @return whether or not USERIP is supported.
     */
    public boolean supportsUserIp()
    {
        return supportsUserIP;
    }

    /**
     * Get whether or not ETRACE is supported.
     *
     * @return whether or not ETRACE is supported.
     */
    public boolean supportsEtrace()
    {
        return supportsEtrace;
    }

    /**
     * Get whether or not SAFELIST is supported.
     *
     * @return whether or not SAFELIST is supported.
     */
    public boolean supportsSafeList()
    {
        return supportsSafeList;
    }

    /**
     * Whether or not SILENCE list is supported
     *
     * @return whether or not the SILENCE list is supported
     */
    public boolean supportsSilenceList()
    {
        return supportsSilenceList;
    }

    /**
     * Get Whether or not nick prefixes are supported.
     *
     * @return whether or not nick prefixes are supported.
     */
    public boolean supportsNickPrefixes()
    {
        return supportsNickPrefixes;
    }

    /**
     * Get whether or not status notices are supported.
     *
     * @return whether or not status notices are supported.
     */
    public boolean supportsStatusNotices()
    {
        return supportsStatusNotice;
    }

    /**
     * Get the maximum number of modes per command
     *
     * @return Maximum of number of modes per command.
     */
    public int getMaxModesPerCommnad()
    {
        return maxModesPerCommand;
    }

    /**
     * Get the maximum away message length
     *
     * @return max away message length
     */
    public int getMaxAwayLength()
    {
        return maxAwayLen;
    }

    /**
     * Get max kick message length
     *
     * @return get the max kick msg length
     */
    public int getMaxKickLength()
    {
        return maxKickLen;
    }

    /**
     * Get the max nick length.
     *
     * @return max nick length
     */
    public int getMaxNickLength()
    {
        return maxNickLen;
    }

    /**
     * Get the maximum silence list length
     *
     * @return max length of the silence list
     */
    public int getMaxSilenceListSize()
    {
        return maxSilenceListSize;
    }

    /**
     * Get the max topic length
     *
     * @return max topic length
     */
    public int getMaxTopicLength()
    {
        return maxTopicLen;
    }

    /**
     * Get the max channel Name Lengt
     *
     * @return max channel name length
     */
    public int getMaxChannelNameLength()
    {
        return maxChanNameLen;
    }

    /**
     * Get the max channel key length
     *
     * @return max channel key length
     */
    public int getMaxKeyLength()
    {
        return maxKeyLen;
    }

    /**
     * Get the maximum Hostname length
     *
     * @return max hostname length
     */
    public int getMaxHostLength()
    {
        return maxHostLen;
    }

    /**
     * Get the max username length
     *
     * @return max username length
     */
    public int getMaxUserLength()
    {
        return maxUserLen;
    }

    /**
     * Get the nickPrefixes.
     *
     * @return the nick prefixes
     */
    public List<String> getNickPrefixes()
    {
        return new ArrayList<>(nickPrefixMap.values());
    }

    /**
     * Get The nickprefixes supported
     *
     * @return the nick prefixes
     */
    public Map<String, String> getNickPrefixMap()
    {
        return nickPrefixMap;
    }

    /**
     * The status prefixes supported
     *
     * @return the supported status prefixes
     */
    public String[] getStatusPrefixes()
    {
        return statusPrefixes;
    }

    /**
     * Get the channel prefixes
     *
     * @return the channel prefixes supported on the server
     */
    public String[] getChannelPrefixes()
    {
        return channelPrefixes;
    }
}
