package tv.phantombot.common;

import org.java_websocket.WebSocket;

/**
 * Stores Session data for the various open WebSocket objects.
 */
public class WebSocketSession {

	private Boolean authenticated;
	private Boolean status;
	private WebSocket webSocket;

	/**
	 * Constructor for wsSession class.
	 *
	 * @param authenticated Indicates if the session is authenticated.
	 * @param webSocket     The WebSocket object that this session relates to.
	 */
	public WebSocketSession(Boolean authenticated, Boolean status, WebSocket webSocket) {
		this.authenticated = authenticated;
		this.status = status;
		this.webSocket = webSocket;
	}

	/**
	 * Sets the authenticated value after the object is constructed.
	 *
	 * @param authenticated Indicates if the session is authenticated.
	 */
	public void setAuthenticated(Boolean authenticated) {
		this.authenticated = authenticated;
	}

	/**
	 * Indicates if this session is authenticated.
	 *
	 * @return Authentication status of the session.
	 */
	public Boolean isAuthenticated() {
		return authenticated;
	}

	/**
	 * Sets the readonly value after the object is constructed.
	 *
	 * @param readonly Indicates if the session is read-only.
	 */
	public void setStatus(Boolean status) {
		this.status = status;
	}

	/**
	 * Indicates if this session is readonly.
	 *
	 * @return Readonly status of the session.
	 */
	public Boolean isStatus() {
		return this.status;
	}

	/**
	 * Sets the WebSocket object after the object is constructed.
	 *
	 * @param webSocket New WebSocket object to associate to this session.
	 */
	public void setWebSocket(WebSocket webSocket) {
		this.webSocket = webSocket;
	}

	/**
	 * Gets the WebSocket object that is associated to the session.
	 *
	 * @return WebSocket object associated with session.
	 */
	public WebSocket getWebSocket() {
		return webSocket;
	}
}