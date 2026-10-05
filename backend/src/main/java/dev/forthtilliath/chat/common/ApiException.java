package dev.forthtilliath.chat.common;

import org.springframework.http.HttpStatus;

/** Erreur métier avec son statut HTTP : rendue en ProblemDetail (REST) ou en ChatError (STOMP). */
public class ApiException extends RuntimeException {

	private final HttpStatus status;

	public ApiException(HttpStatus status, String message) {
		super(message);
		this.status = status;
	}

	public static ApiException badRequest(String message) {
		return new ApiException(HttpStatus.BAD_REQUEST, message);
	}

	public static ApiException unauthorized(String message) {
		return new ApiException(HttpStatus.UNAUTHORIZED, message);
	}

	public static ApiException forbidden(String message) {
		return new ApiException(HttpStatus.FORBIDDEN, message);
	}

	public static ApiException notFound(String message) {
		return new ApiException(HttpStatus.NOT_FOUND, message);
	}

	public static ApiException conflict(String message) {
		return new ApiException(HttpStatus.CONFLICT, message);
	}

	public static ApiException tooManyRequests(String message) {
		return new ApiException(HttpStatus.TOO_MANY_REQUESTS, message);
	}

	public HttpStatus getStatus() {
		return status;
	}
}
