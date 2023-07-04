# Sanitize Funciton

The sanitize function is used to remove spaces and symbols from a string. In PhantomBot it is commonly used to ensure usernames used within the code have any @ or ' ' it may have been input with removed. 

### Syntax
`$.user.sanitize(string);`

### Example
`$.user.sanitize(username);`

If the variable username was `@TwitchUserName `, sanitize would output `twitchusername`.