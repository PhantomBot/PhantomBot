**Please read, especially if your first time contributing to PhantomBot:**

Thank you for contributing to PhantomBot! Hopefully you followed the code style guide:
https://github.com/PhantomBot/PhantomBot/blob/master/development-resources/CODESTYLE.md

If you added in code from a third party, it must have a license that is compatible with PhantomBot.  If it is not, we will reject the merge request.  The development team takes this very seriously.  If you add in access to an API and PhantomBot would use that API improperly, we will reject the merge request.  Again, the development team takes this very seriously.

You must provide test results for your change.  If test results are not provided we will do one of two things. We will ask you for test results or we will just reject the change.  Test results convince us that you verified your change.

We reserve the right to reject a change for any reason at all.  Typically, we will provide a reason but if we do not, that is at our discretion.  There are some reasons for which we will reject changes, other than the ones given above (but they will be repeated):

- Code style does not match (Old code styles may not be valid anymore).
- Incompatible license/improper use of license of third party software/API.
- No test results.
- Potential performance issues.
- Design changes that go against the core design philosophy.
- Items with potential to spam or consume the outgoing message queue.
- Poorly architected items.
- Item is supported in chat but no update for the Control Panel.
- Any command that would violate the Twitch Terms of Service or the Terms of Service of any provider.
- The remote panel is changed (docs/panel). This is done via automation from the bot copy (resources/web/panel)
- The stable remote panel is changed (docs/panel-stable). This is done via automation upon release
- The stable guides are changed (docs/guides/content-stable). This is done via automation upon release

You are not to harass the development team if a pull request is rejected.  You may discuss and argue why you disagree with a rejection.  We do ask that you stay professional and amicable in your argument and discussion.

All pull requests will be reviewed by at least one PhantomBot developer. Please be patient while two developers take the time to do so.  We understand that this adds time to an approval, but it is to ensure that the development team is not missing anything.
