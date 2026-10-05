package dev.forthtilliath.chat.user;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import dev.forthtilliath.chat.user.dto.SessionRequest;
import dev.forthtilliath.chat.user.dto.SessionResponse;

@RestController
@RequestMapping("/api/session")
public class SessionController {

	private final SessionService sessions;

	public SessionController(SessionService sessions) {
		this.sessions = sessions;
	}

	@PostMapping
	public SessionResponse open(@Validated @RequestBody SessionRequest request,
			@RequestHeader(name = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
		return sessions.open(request, Tokens.fromBearer(authorization));
	}

	@GetMapping
	public UserView me(@CurrentUser ChatUser user) {
		return sessions.me(user);
	}

	@DeleteMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void close(@CurrentUser ChatUser user) {
		sessions.close(user);
	}
}
