/**
 * donationHandler.js
 *
 * Detect and report donations.
 */
(function () {
  var donationReward = ($.inidb.exists('settings', 'hostReward') ? $.inidb.get('settings', 'hostReward') : 200),
      announceDonations = false;

  /**
   * @event twitchAlertsDonationsInitialized
   */
  $.bind('twitchAlertsDonationInitialized', function () {
    if (!$.bot.isModuleEnabled('./handlers/donationsHandler.js')) {
      return;
    }

    $.consoleLn(">> Enabling Twitch Alerts donation announcements");
    announceDonations = true;
  });

  /**
   * @event twitchAlertsDonations
   */
  $.bind('twitchAlertsDonation', function (event) {
    if (!$.bot.isModuleEnabled('./handlers/donationHandler.js')) {
      return;
    }

    var donationJson = event.getJsonString();
    var donationInfo = JSON.parse(donationJson);
    var donationID = donationInfo[0],
        donationCreatedAt = donationInfo[1],
        donationCurrency = donationInfo[2],
        donationAmount = donationInfo[3],
        donationUsername = donationInfo[4],
        donationMessage = donationInfo[5];

    if (!announceDonations) {
      return;
    }

    if ($.inidb.exists('donations', donationID)) {
      return;
    }

    $.inidb.set('donations', donationID, donationJson);
    $.inidb.set('donations', 'last_donation', donationID);

    $.writeToFile(donationUsername + ": " + donationAmount, "./addons/donationHandler/latestDonation.txt", false);

    if ($.lang.exists('donationhandler.donation.new')) {
      var donationSay = $.lang.get('donationhandler.donation.new');
      donationSay = donationSay.replace('(name)', donationUsername);
      donationSay = donationSay.replace('(amount)', donationAmount);
      $.say(donationSay);
    }

  });

  /**
   * @event command
   */
  $.bind('command', function (event) {
    var sender = event.getSender().toLowerCase(),
        command = event.getCommand(),
        args = event.getArgs(),
        commandArg = parseInt(args[0]),
        temp = [],
        i;

    /**
     * @commandpath lastdonation - Display the last donation.
     */
    if (command.equalsIgnoreCase('lastdonation')) {
      if (!$.inidb.exists('donations', 'last_donation')) {
        $.say($.lang.get('donationhandler.lastdonation.no-donations'));
        return;
      }

      var donationID = $.inidb.get('donations', 'last_donation');
      if (!$.inidb.exists('donations', donationID)) {
        $.say($.lang.get('donationhandler.lastdonation.404'));
        return;
      }

      var donationInfo = JSON.parse($.inidb.get('donations', donationID));
      var donationID = donationInfo[0],
          donationCreatedAt = donationInfo[1],
          donationCurrency = donationInfo[2],
          donationAmount = donationInfo[3],
          donationUsername = donationInfo[4],
          donationMessage = donationInfo[5];

      var donationSay = $.lang.get('donationhandler.lastdonation.success');
      donationSay = donationSay.replace('(name)', donationUsername);
      donationSay = donationSay.replace('(amount)', donationAmount);
      $.say(donationSay);
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./handlers/donationHandler.js')) {
      $.registerChatCommand('./handlers/donationHandler.js', 'lastdonation', 7);
    }
  });
})();
