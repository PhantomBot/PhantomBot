/**
 * donationHandler.js
 *
 * Detect and report donations.
 */
(function () {
  var announceDonations = false;

  /**
   * @event twitchAlertsDonationsInitialized
   */
  $.bind('twitchAlertsDonationInitialized', function () {
    if (!$.bot.isModuleEnabled('./handlers/donationHandler.js')) {
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

    var donationJsonStr = event.getJsonString(),
        JSONObject = Packages.org.json.JSONObject,
        donationJson = new JSONObject(donationJsonStr);

    var donationID = donationJson.getString("donation_id"),
        donationCreatedAt = donationJson.getString("created_at"),
        donationCurrency = donationJson.getString("currency"),
        donationAmount = parseFloat(donationJson.getString("amount")),
        donationUsername = donationJson.getString("name"),
        donationMessage = donationJson.getString("message");

    if (!announceDonations) {
      return;
    }

    if ($.inidb.exists('donations', donationID)) {
      return;
    }

    $.inidb.set('donations', donationID, donationJson);
    $.inidb.set('donations', 'last_donation', donationID);

    $.writeToFile(donationUsername + ": " + donationAmount.toFixed(2), "./addons/donationchecker/latestDonation.txt", false);

    if ($.lang.exists('donationhandler.donation.new')) {
      var donationSay = $.lang.get('donationhandler.donation.new');
      donationSay = donationSay.replace('(name)', donationUsername);
      donationSay = donationSay.replace('(amount)', donationAmount.toFixed(2));
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

      var donationJsonStr = $.inidb.get('donations', donationID),
          JSONObject = Packages.org.json.JSONObject,
          donationJson = new JSONObject(donationJsonStr);

      var donationID = donationJson.getString("donation_id"),
          donationCreatedAt = donationJson.getString("created_at"),
          donationCurrency = donationJson.getString("currency"),
          donationAmount = parseFloat(donationJson.getString("amount")),
          donationUsername = donationJson.getString("name"),
          donationMessage = donationJson.getString("message");

      var donationSay = $.lang.get('donationhandler.lastdonation.success');
      donationSay = donationSay.replace('(name)', donationUsername);
      donationSay = donationSay.replace('(amount)', donationAmount.toFixed(2));
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
