package dev.forthtilliath.chat.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.jayway.jsonpath.JsonPath;

import dev.forthtilliath.chat.IntegrationTest;

@IntegrationTest
class SessionApiTest {

	@Autowired
	private MockMvc mvc;

	@Test
	void opensASessionAndJoinsGeneral() throws Exception {
		String token = token(open("s-alice", null).andExpect(status().isOk())
				.andExpect(jsonPath("$.user.nickname").value("s-alice"))
				.andExpect(jsonPath("$.user.color").value("azur")));

		mvc.perform(get("/api/session").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.nickname").value("s-alice"));
		mvc.perform(get("/api/rooms").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(jsonPath("$[?(@.name == 'general')].joined").value(true))
				.andExpect(jsonPath("$[?(@.name == 'angular')].joined").value(false));
	}

	@Test
	void refusesANicknameOnAirButLetsItsOwnerResume() throws Exception {
		String token = token(open("s-Bob", null));

		open("S-BOB", null).andExpect(status().isConflict());
		open("s-bob", "Bearer " + token).andExpect(status().isOk())
				.andExpect(jsonPath("$.token").value(token))
				.andExpect(jsonPath("$.user.nickname").value("s-bob"));
	}

	@Test
	void reservesBotsAndFreesReleasedNicknames() throws Exception {
		open("ADA", null).andExpect(status().isConflict());
		open("margot", null).andExpect(status().isOk());

		String token = token(open("s-carol", null));
		mvc.perform(delete("/api/session").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isNoContent());
		mvc.perform(get("/api/session").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isUnauthorized());
		open("s-carol", null).andExpect(status().isOk());
	}

	@Test
	void validatesTheNickname() throws Exception {
		open("a", null).andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.nickname").value(Nicknames.RULE));
		open("élodie", null).andExpect(status().isBadRequest());
	}

	@Test
	void protectsTheApi() throws Exception {
		mvc.perform(get("/api/rooms")).andExpect(status().isUnauthorized());
		mvc.perform(get("/api/rooms").header(HttpHeaders.AUTHORIZATION, "Bearer inconnu"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.detail").value("Session expirée : reconnectez-vous."));
	}

	private ResultActions open(String nickname, String authorization) throws Exception {
		var request = post("/api/session").contentType(MediaType.APPLICATION_JSON)
				.content("{\"nickname\":\"" + nickname + "\",\"color\":\"azur\"}");
		if (authorization != null) {
			request.header(HttpHeaders.AUTHORIZATION, authorization);
		}
		return mvc.perform(request);
	}

	private static String token(ResultActions result) throws Exception {
		return JsonPath.read(result.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8), "$.token");
	}
}
