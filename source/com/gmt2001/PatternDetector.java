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
package com.gmt2001;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Provides pattern matchers to JS, where Java RegEx is required
 *
 * @author gmt2001
 */
public final class PatternDetector {
    /**
     * The pattern for just the TLD portion of a links pattern
     * <p>
     * This is generated using TldRegexUpdater
     *
     * @see https://github.com/StreamActions/StreamActions/tree/main/TldRegexUpdater
     */
    private final static String TLD_PATTERN = "(?<webtld>(?:a(?:a(?:a|rp)|b(?:b(?:|ott|vie)|c|arth|le|ogado|udhabi)|c(?:|c(?:enture|ountant(?:|s))|o|ademy|tor)|d(?:|s|ult)|e(?:|g|ro|tna)|f(?:|l|rica)|g(?:|akhan|ency)|i(?:|g|r(?:bus|force|tel))|l(?:|i(?:baba|pay)|l(?:y|finanz|state)|s(?:ace|tom)|faromeo)|m(?:|e(?:x|rican(?:express|family))|azon|fam|ica|sterdam)|n(?:z|alytics|droid|quan)|o(?:|l)|p(?:p(?:|le)|artments)|q(?:|uarelle)|r(?:|a(?:b|mco)|t(?:|e)|chi|my|pa)|s(?:|da|ia|sociates)|t(?:|hleta|torney)|u(?:|t(?:o(?:|s)|hor)|ction|di(?:|o|ble)|spost)|w(?:|s)|x(?:|a)|z(?:|ure)|kdn|vianca)|b(?:a(?:|n(?:a(?:mex|narepublic)|[dk])|r(?:|c(?:elona|lay(?:s|card))|efoot|gains)|s(?:eball|ketball)|by|idu|uhaus|yern)|b(?:|[ct]|va)|c(?:[gn])|[dfgjstvwy]|e(?:|a(?:ts|uty)|t|er|ntley|rlin|st(?:|buy))|h(?:|arti)|i(?:|[doz]|ble|ke|ng(?:|o))|l(?:o(?:g|ckbuster|omberg)|ack(?:|friday)|ue)|m(?:|[sw])|n(?:|pparibas)|o(?:|[mtx]|o(?:|k(?:|ing))|s(?:t(?:ik|on)|ch)|ats|ehringer|fa|nd|utique)|r(?:|o(?:adway|ker|ther)|adesco|idgestone|ussels)|u(?:y|ild(?:|ers)|siness|zz)|z(?:|h))|c(?:a(?:|b|l(?:|l|vinklein)|m(?:|p|era)|p(?:etown|ital(?:|one))|r(?:|e(?:|er(?:|s))|s|avan|ds)|s(?:[aeh]|ino)|t(?:|ering|holic)|fe|non)|b(?:[ans]|re)|[cdgkmnv-xz]|e(?:o|nter|rn)|f(?:|[ad])|h(?:|a(?:n(?:el|nel)|t|rity|se)|r(?:istmas|ome)|eap|intai|urch)|i(?:|t(?:i(?:|c)|y(?:|eats)|adel)|priani|rcle|sco)|l(?:|i(?:ck|ni(?:c|que))|o(?:thing|ud)|aims|eaning|ub(?:|med))|o(?:|l(?:lege|ogne)|m(?:|m(?:bank|unity)|p(?:a(?:ny|re)|uter)|cast|sec)|n(?:s(?:truction|ulting)|t(?:act|ractors)|dos)|o(?:[lp]|king(?:|channel))|u(?:ntry|pon(?:|s)|rses)|ach|des|ffee|rsica)|r(?:|s|edit(?:|card|union)|icket|own|uise(?:|s))|u(?:|isinella)|y(?:|mru|ou)|pa)|d(?:a(?:[dy]|t(?:[ae]|ing|sun)|bur|nce)|e(?:|l(?:l|ivery|oitte|ta)|v|al(?:|s|er)|gree|mocrat|nt(?:al|ist)|si(?:|gn))|i(?:s(?:h|co(?:unt|ver))|y|amonds|et|gital|rect(?:|ory))|[jkmz]|o(?:|c(?:s|tor)|[gt]|mains|wnload)|u(?:bai|nlop|pont|rban)|v(?:r|ag)|clk|ds|hl|np|rive|tv)|e(?:a(?:t|rth)|c(?:|o)|d(?:u(?:|cation)|eka)|[eg]|m(?:ail|erck)|n(?:ergy|gineer(?:|ing)|terprises)|r(?:|icsson|ni)|s(?:|q|tate)|t(?:|isalat)|u(?:|s|rovision)|x(?:p(?:ert|osed|ress)|change|traspace)|pson|quipment|vents)|f(?:a(?:i(?:l|rwinds|th)|n(?:|s)|s(?:t|hion)|ge|mily|rm(?:|ers))|e(?:dex|edback|rr(?:ari|ero))|i(?:|d(?:o|elity)|r(?:e(?:|stone)|mdale)|t(?:|ness)|at|lm|na(?:l|nc(?:e|ial))|sh(?:|ing))|[jkm]|l(?:i(?:r|ckr|ghts)|o(?:rist|wers)|y)|o(?:|o(?:|d(?:|network)|tball)|r(?:d|ex|sale|um)|x|undation)|r(?:|e(?:e|senius)|l|o(?:gans|nt(?:door|ier)))|u(?:n(?:|d)|jitsu|rniture|tbol)|tr|yi)|g(?:a(?:|l(?:|l(?:o|ery|up))|[py]|me(?:|s)|rden)|b(?:|iz)|d(?:|n)|e(?:|a|nt(?:|ing)|orge)|[fhnpqstwy]|g(?:|ee)|i(?:|v(?:es|ing)|ft(?:|s))|l(?:|e|ass|ob(?:o|al))|m(?:|[ox]|ail|bh)|o(?:l(?:d(?:|point)|f)|o(?:|g(?:|le)|dyear)|[ptv]|daddy)|r(?:|a(?:inger|phics|tis)|o(?:cery|up)|een|ipe)|u(?:|i(?:de|tars)|ardian|cci|ge|ru))|h(?:a(?:ir|mburg|ngout|us)|e(?:l(?:p|sinki)|r(?:e|mes)|alth(?:|care))|i(?:v|phop|samitsu|tachi)|k(?:|t)|[mnrt]|o(?:l(?:dings|iday)|s(?:t(?:|ing)|pital)|t(?:|el(?:s|es)|mail)|w|ckey|me(?:s(?:|ense)|depot|goods)|nda|rse|use)|u(?:|ghes)|y(?:att|undai)|bo|dfc(?:|bank)|gtv|sbc)|i(?:c(?:[eu]|bc)|[dloq]|e(?:|ee)|m(?:|amat|db|mo(?:|bilien))|n(?:|[cgk]|f(?:o|initi)|s(?:titute|ur(?:e|ance))|t(?:|ernational|uit)|dustries|vestments)|r(?:|ish)|s(?:|t(?:|anbul)|maili)|t(?:|v|au)|bm|fm|kano|piranga)|j(?:a(?:guar|va)|e(?:|ep|tzt|welry)|m(?:|p)|o(?:|b(?:s|urg)|[ty])|p(?:|morgan|rs)|u(?:egos|niper)|cb|io|ll|nj)|k(?:e(?:|rry(?:hotels|logistics|properties))|[ghmnwz]|i(?:|[am]|ds|nd(?:er|le)|tchen|wi)|o(?:eln|matsu|sher)|p(?:|n|mg)|r(?:|d|ed)|y(?:|oto)|aufen|ddi|fh|uokgroup)|l(?:a(?:|m(?:borghini|er)|n(?:c(?:aster|ia)|d(?:|rover)|xess)|t(?:|ino|robe)|w(?:|yer)|caixa|salle)|[bckrsvy]|e(?:g(?:o|al)|ase|clerc|frak|xus)|i(?:|m(?:o|ited)|n(?:k|coln)|v(?:e|ing)|dl|fe(?:|insurance|style)|ghting|ke|lly|psy)|l(?:[cp])|o(?:c(?:ker|us)|l|an(?:|s)|ndon|tt(?:[eo])|ve)|t(?:|d(?:|a))|u(?:|x(?:e|ury)|ndbeck)|ds|gbt|pl(?:|financial))|m(?:a(?:|i(?:f|son)|n(?:|agement|go)|p|r(?:ket(?:|s|ing)|riott|shalls)|drid|keup|serati|ttel)|c(?:|kinsey)|[dghknp-rv-z]|e(?:|d(?:|ia)|m(?:e|orial)|n(?:|u)|et|lbourne|rckmsd)|i(?:l|n(?:[it])|t(?:|subishi)|ami|crosoft)|l(?:|[bs])|m(?:|a)|o(?:|[eim]|n(?:ash|ey|ster)|r(?:mon|tgage)|v(?:|ie)|bi(?:|le)|da|scow|to(?:|rcycles))|s(?:|d)|t(?:|[nr])|u(?:|s(?:eum|ic)|tual)|ba)|n(?:a(?:|b|goya|me|tura|vy)|[clpuz]|e(?:|c|t(?:|bank|flix|work)|w(?:|s)|x(?:t(?:|direct)|us)|ustar)|f(?:|l)|g(?:|o)|i(?:|k(?:e|on)|co|nja|ssa(?:[ny]))|o(?:|w(?:|ruz|tv)|kia|rt(?:hwesternmutual|on))|r(?:|[aw])|ba|hk|tt|yc)|o(?:b(?:i|server)|l(?:ayan(?:|group)|dnavy|lo)|m(?:|ega)|n(?:[eg]|l(?:|ine))|r(?:a(?:cle|nge)|g(?:|anic)|igins)|t(?:t|suka)|ffice|kinawa|oo|pen|saka|vh)|p(?:a(?:|r(?:s|t(?:[sy]|ners)|is)|y|ge|nasonic|ssagens)|e(?:|t)|f(?:|izer)|[gkmsty]|h(?:|d|o(?:ne|to(?:|s|graphy))|armacy|ilips|ysio)|i(?:c(?:s|t(?:et|ures))|d|n(?:|[gk])|oneer|zza)|l(?:|a(?:y(?:|station)|ce)|u(?:s|mbing))|[nw](?:|c)|o(?:hl|ker|litie|rn|st)|r(?:|a(?:merica|xi)|o(?:|d(?:|uctions)|f|gressive|mo|pert(?:y|ies)|tection)|u(?:|dential)|ess|ime)|ccw|ub)|q(?:a|pon|ue(?:bec|st))|r(?:a(?:cing|dio)|e(?:|a(?:d|l(?:t(?:y|or)|estate))|d(?:|stone|umbrella)|i(?:t|se(?:|n))|n(?:|t(?:|als))|p(?:air|ort|ublican)|cipes|hab|liance|st(?:|aurant)|view(?:|s)|xroth)|i(?:c(?:h(?:|ardli)|oh)|[lop])|o(?:|c(?:her|ks)|deo|gers|om)|s(?:|vp)|u(?:|n|gby|hr)|w(?:|e)|yukyu)|s(?:a(?:|l(?:e|on)|n(?:dvik(?:|coromant)|ofi)|[ps]|arland|fe(?:|ty)|kura|ms(?:club|ung)|rl|ve|xo)|b(?:|[is])|c(?:|[ab]|h(?:o(?:larships|ol)|aeffler|midt|ule|warz)|ience|ot)|[dgjsvxz]|e(?:|a(?:t|rch)|w|x(?:|y)|cur(?:e|ity)|ek|lect|ner|rvices|ven)|h(?:|a(?:w|ngrila|rp)|i(?:a|ksha)|o(?:p(?:|ping)|w(?:|time)|es|uji)|ell)|i(?:|n(?:a|gles)|lk|te)|k(?:|i(?:|n)|y(?:|pe))|l(?:|ing)|m(?:|art|ile)|n(?:|cf)|o(?:|c(?:cer|ial)|l(?:ar|utions)|n(?:[gy])|y|ft(?:bank|ware)|hu)|p(?:a(?:|ce)|o(?:t|rt))|r(?:|l)|t(?:|a(?:r|da|ples|te(?:bank|farm))|c(?:|group)|o(?:r(?:e|age)|ckholm)|ream|ud(?:y|io)|yle)|u(?:|r(?:f|gery)|cks|pp(?:l(?:y|ies)|ort)|zuki)|w(?:atch|iss)|y(?:|dney|stems)|fr)|t(?:a(?:b|t(?:a(?:r|motors)|too)|x(?:|i)|ipei|lk|obao|rget)|c(?:|i)|d(?:|k)|e(?:l|am|ch(?:|nology)|masek|nnis|va)|[fglntwz]|h(?:|d|eat(?:er|re))|i(?:r(?:es|ol)|aa|ckets|enda|ffany|ps)|j(?:|x|maxx)|k(?:|maxx)|m(?:|all)|o(?:|p|y(?:s|ota)|day|kyo|ols|ray|shiba|tal|urs|wn)|r(?:|a(?:d(?:e|ing)|ining|vel(?:|channel|ers(?:|insurance)))|v|ust)|u(?:i|be|nes|shu)|v(?:|s))|u(?:[agksyz]|b(?:s|ank)|n(?:i(?:com|versity)|o)|ol|ps)|v(?:a(?:|n(?:a|guard)|cations)|[cgn]|e(?:|r(?:isign|sicherung|mögensberat(?:er|ung))|t|gas|ntures)|i(?:|[gnp]|s(?:a|ion)|v(?:[ao])|ajes|deo|king|llas|rgin)|o(?:l(?:kswagen|vo)|t(?:[eo]|ing)|dka|yage)|u(?:|elos)|laanderen)|w(?:a(?:l(?:es|mart|ter)|ng(?:|gou)|tch(?:|es))|e(?:b(?:cam|er|site)|d(?:|ding)|i(?:r|bo)|ather(?:|channel))|[fs]|i(?:n(?:|e|dows|ners)|en|ki|lliamhill)|o(?:r(?:k(?:|s)|ld)|w|lterskluwer|odside)|t(?:[cf])|hoswho|me)|x(?:i(?:n|huan)|box|erox|finity|n--(?:1(?:1b4c3d|ck2e1b|qqw23a)|3(?:0rr7y|bst00m|ds443g|e0b707e|hcrj9c|pxu8k)|4(?:5(?:br(?:5cyl|j9c)|q11c)|2c2d9a|dbrk0ce|gbrim)|5(?:4b7fta0cc|5q(?:w42g|x5d)|su34j936bgsg|tzm5g)|6(?:frz82g|qq986b3xl)|8(?:0a(?:s(?:ehdb|wg)|dxhks|o21a|qecdr1a)|y0a063a)|9(?:0a(?:e|3ac|is)|dbq2a|et52u|krt00a)|b(?:4w605ferd|ck1b9a5dre4c)|c(?:1avg|2br7g|ck(?:2b3b|wcxetd)|g4bki|lchc0ea0b2g2a9gcd|zr(?:694b|s0t|u2d))|e(?:1a4c|ckvdtc9d|fvy88h)|f(?:z(?:c2c9e2c|ys8d69uvgm)|ct429k|hbei|iq(?:228c5hs|64b|s8s|z9s)|jq720a|lw351e|pcrj9c3d)|g(?:2xx48c|ckr3f0f|ecrj9c|k3at1e)|h(?:2br(?:eg3eve|j9c(?:|8c))|xt814e)|i(?:1b6b1a6a2e|mr513n|o0a7i)|j(?:1a(?:ef|mh)|6w193g|lq480n2rg|vr189m)|k(?:p(?:r(?:w13d|y57d)|ut3i)|crx77d1x4a)|l(?:1acc|gbbat1ad8j)|m(?:gb(?:a(?:a(?:kc7dvf|m7a8h)|3a(?:3ejt|4f16a)|7c0bbn0a|b2bd|h1a3hjkrd|i9azgqp6j|yh7gpa)|c(?:0a9azcg|a7dzdo|pq6gpa1a)|t(?:3dhd|x2b)|9awbf|bh1a(?:|71e)|erp4a5d4ar|gu82a|i4ecexp|pl2fh|x4cd0ab)|ix891f|k1bu44c|xtq1m)|n(?:gb(?:c5azd|e9e0a|rx)|ode|qv7f(?:|s00ema)|yqy26a)|o(?:3cw4h|gbpf8fl|tu796d)|p(?:1a(?:i|cf)|gbs0dh|ssy2u)|q(?:7ce6a|9jyb4c|cka1pmc|xa(?:m|6a))|r(?:hqv96g|ovu88b|vc1e0am3e)|s(?:9brj9c|es554g)|t(?:60b56a|ckwe|iq49xqyj)|v(?:ermgensberat(?:er-ctb|ung-pwb)|hquv|uq861b)|w(?:4r(?:85el8fhu5dnra|s40l)|gb(?:h1c|l6a))|x(?:hq521b|kc2(?:al3hye2a|dl3a5ee0h))|y(?:9a3aq|fro4i67o|gbi2ammx)|2scrj9c|d1a(?:cj3b|lf)|unup4y|zfr164b)|xx|yz)|م(?:و(?:قع|ريتانيا)|ليسيا|صر)|公(?:[益司])|香(?:港|格里拉)|网(?:[站店络址])|м(?:о(?:н|сква)|кд)|к(?:атолик|ом)|о(?:нлайн|рг)|с(?:айт|рб)|б(?:г|ел)|商(?:[标店城])|新(?:闻|加坡)|ك(?:وم|اثوليك)|中(?:[信国國]|文网)|台(?:[湾灣])|ا(?:ل(?:جزائر|عليان|اردن|مغرب|بحرين|سعودية)|رامكو|یران|تصالات|مارات|بوظبي)|ع(?:ر(?:ب|اق)|مان)|ب(?:ا(?:زار|رت)|ھارت|يتك)|닷(?:[컴넷])|政(?:[府务])|р(?:ф|ус)|ε(?:[υλ])|இ(?:லங்கை|ந்தியா)|y(?:a(?:chts|hoo|maxun|ndex)|[et]|o(?:u(?:|tube)|dobashi|ga|kohama)|un)|z(?:a(?:|ppos|ra)|[mw]|ero|ip|one|uerich)|कॉम|セール|佛山|ಭಾರತ|慈善|集团|在线|한국|ଭାରତ|点看|คอม|ভা(?:ৰত|রত)|八卦|ישראל|বাংলা|移动|我爱你|қаз|联通|קום|时尚|微博|淡马锡|ファッション|नेट|ストア|アマゾン|삼성|சிங்கப்பூர்|дети|ею|ポイント|家電|娱乐|谷歌|భారత్|ලංකා|電訊盈科|购物|クラウド|ભારત|通販|भार(?:त(?:|म्)|ोत)|संगठन|餐厅|укр|亚马逊|食品|飞利浦|手机|پاکستان|ڀارت|سو(?:دان|رية)|همراه|澳門|شبكة|გე|机构|组织机构|健康|ไทย|招聘|تونس|大拿|ລາວ|みんな|グーグル|世界|書籍|ഭാരതം|ਭਾਰਤ|コム|天主教|游戏|企业|信息|嘉里(?:|大酒店)|قطر|广东|հայ|فلسطين))";
    /**
     * Pattern for TLDs that should have space checks around the dot, and other workarounds
     */
    private final static String TLD_WORKAROUND_PATTERN = "(?<webworkaroundtld>(?:co(?:|m)|org|net|info|ly))";
    /**
     * Compiled links pattern incorporating {@link #TLD_PATTERN}
     *
     * @see #linksMatcher(String) for an explanation of what this pattern captures
     */
    private final static Pattern LINKS_PATTERN = Pattern.compile("(?i)(?U)(?:\\b|^)(?:(?<weburi>(?:(?<webscheme>(?:|[st])ftp(?:|s)|http(?:|s)|rtsp(?:|s)|ws(?:|s)):\\/\\/)?(?<webauthority>(?<webdomain>[\\p{L}\\p{S}\\p{Mn}\\p{Nd}\\p{Nl}\\p{No}\\p{Pc}\\p{Pd}\\p{Po}]+)(?:\\." + TLD_PATTERN + "|(?:\\s*\\.\\s*)" + TLD_WORKAROUND_PATTERN + ")(?:\\:(?<webport>\\d{1,5}))?))|(?<ip>(?<ipv4>(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])\\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])\\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])\\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9]))|(?<ipv6>(?:::)?(?:[0-9a-fA-F]{1,4}(?:::|:)){2,7}(?:[0-9a-fA-F]{1,4}|)|(?:::[0-9a-fA-F]{1,4})|(?:[0-9a-fA-F]{1,4}::(?:[0-9a-fA-F]{1,4})?)))|(?<protouri>(?<protoscheme>bitcoin(?:|cash)|c(?:allto|ontent)|ed2k|f(?:acetime|eed)|git|i(?:ntent|rc(?:|6|s))|jar|m(?:a(?:gnet|ilto|ps|rket)|ms)|payto|s(?:ip(?:|s)|kype|potify|team)|te(?:ams(?:|peak)|l)|webcal|xmpp):(?:\\/\\/)?(?<protourn>(?:[\\p{L}\\p{S}\\p{Mn}\\p{Nd}\\p{Nl}\\p{No}\\p{Pc}\\p{Pd}\\p{Po}])+)))(?:\\b|$)");

    /**
     * Static class. Constructor disabled
     */
    private PatternDetector() {}

    /**
     * Provides a {@link Matcher} for the links pattern against the input string
     * <p>
     * Use the top-level capture groups to determine which type of match was made
     * <p>
     * All matches are made using Unicode Case-Insensitive rules
     * <p>
     * The links pattern checks for any of the following:
     * <ul>
     * <li>Any text followed by a full stop {@code .} followed by a valid TLD, which looks like an HTTP, FTP, RTSP, or WS link
     * <ul><li>Unicode text is supported</li>
     * <li>Non-ASCII TLDs match against both the punycode and Unicode representations, such as matching either {@code xn--vermgensberater-ctb} or {@code vermögensberater}</li>
     * <li>The scheme and port are matched optionally for the purposes of including them in the capture groups</li>
     * <li>The path, query, and fragment are <i>not</i> matched or output in the capture groups</li>
     * <li>
     * Capture Groups:
     * <ul>
     * <li><i>weburi</i> - the whole match of scheme and authority, such as {@code https://hello.example.com:25000}
     * <ul>
     * <li><i>webscheme</i> - the scheme, if present, such as {@code https}</li>
     * <li><i>webauthority</i> - the entire authority, such as {@code hello.examaple.com:25000}
     * <ul>
     * <li><i>webdomain</i> - the domain component, including subdomain, such as {@code hello.example}</li>
     * <li>the TLD, such as {@code com}
     * <ul>
     * <li><i>webtld</i> - if spaces were not used around the dot and no known workarounds were detected {@code example.com}</li>
     * <li><i>webworkaroundtld</i> - if spaces were used around the dot, or another potential workaround to detection was used {@code example. com}</li>
     * <li><i>Only some TLDs are covered by workaround detection</i></li>
     * </ul>
     * </li>
     * <li><i>webport</i> - the port, if present, such as {@code 25000}</li>
     * </ul>
     * </li>
     * </ul></li>
     * </ul>
     * </li></ul></li>
     * <li>IP addresses
     * <ul>
     * <li>Capture Groups:
     * <ul>
     * <li><i>ip</i> - any type of IP address
     * <ul>
     * <li><i>ipv4</i> - any sequence of base-10 numbers {@code [0-9]} and full stops {@code .} that looks like a valid IPv4 address</li>
     * <li><i>ipv6</i> - any sequence of base-16 numbers {@code [0-9a-fA-F]} and colons {@code :} that looks like an IPv6 address
     * <ul><li>Supports rules for removing leading {@code 0} in each group</li>
     * <li>Supports {@code ::}</li>
     * <li>Will false-trigger on incorrect usage of colons, such as {@code 2001:0db8::ff00::8329}</li></ul></li>
     * </ul>
     * </ul>
     * </li>
     * </ul>
     * </li>
     * <li>Any text that looks like a selected list of URIs used for other protocols, such as {@code skype:}, {@code magnet:}, and {@code mailto:}
     * <ul>
     * <li>Capture Groups:
     * <ul>
     * <li><i>protouri</i> - the whole match of protocol URI, such as {@code magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a}
     * <ul>
     * <li><i>protoscheme</i> - the scheme, such as {@code magnet}</li>
     * <li><i>protourn</i> - the urn or other data of the URI, such as {@code ?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a}</li>
     * </ul>
     * </li>
     * </ul>
     * </li>
     * </ul>
     * </li>
     * </ul>
     *
     * @param str the string being tested
     * @return a {@link Matcher} that can be used to test if the string contains links
     */
    public static Matcher linksMatcher(String str) {
        return LINKS_PATTERN.matcher(str);
    }

    /**
     * Indicates if the input string matches the links regex
     *
     * @see #linksMatcher(String)
     *
     * @param str the string being tested
     * @return {@code true} if a link is detected
     */
    public static boolean hasAnyLinks(String str) {
        return linksMatcher(str).find();
    }

    /**
     * Indicates if the input string matches the links regex for the {@code weburi} capture group
     *
     * @see #linksMatcher(String)
     *
     * @param str the string being tested
     * @return {@code true} if a link is detected in the {@code weburi} capture group
     */
    public static boolean hasWebLinks(String str) {
        Matcher matcher = linksMatcher(str);

        if (matcher.find()) {
            return matcher.group("weburi") != null;
        }

        return false;
    }

    /**
     * Indicates if the input string matches the links regex for the {@code ip} capture group
     *
     * @see #linksMatcher(String)
     *
     * @param str the string being tested
     * @return {@code true} if a link is detected in the {@code ip} capture group
     */
    public static boolean hasIpLinks(String str) {
        Matcher matcher = linksMatcher(str);

        if (matcher.find()) {
            return matcher.group("ip") != null;
        }

        return false;
    }

    /**
     * Indicates if the input string matches the links regex for the {@code protouri} capture group
     *
     * @see #linksMatcher(String)
     *
     * @param str the string being tested
     * @return {@code true} if a link is detected in the {@code protouri} capture group
     */
    public static boolean hasProtoLinks(String str) {
        Matcher matcher = linksMatcher(str);

        if (matcher.find()) {
            return matcher.group("protouri") != null;
        }

        return false;
    }

    /**
     * Returns the link contained in the input string which matches the links regex
     * <p>
     * If multiple links are present, only the first one returned by the {@link Matcher} is returned
     * <p>
     * Matches against all link types
     *
     * @see #linksMatcher(String)
     *
     * @param str the string being tested
     * @return {@code null} if no links were detected; otherwise, the first link returned by the {@link Matcher}
     */
    public static String getLink(String str) {
        Matcher matcher = linksMatcher(str);

        if (matcher.find()) {
            return matcher.group();
        }

        return null;
    }

    /**
     * Returns all links contained in the input string which matches the links regex
     * <p>
     * Matches against all link types
     *
     * @see #linksMatcher(String)
     *
     * @param str the string being tested
     * @return a {@link List} of links returned by the {@link Matcher}
     */
    public static List<String> getLinks(String str) {
        Matcher matcher = linksMatcher(str);
        List<String> links = new ArrayList<>();

        while (matcher.find()) {
            links.add(matcher.group());
        }

        return Collections.unmodifiableList(links);
    }
}
