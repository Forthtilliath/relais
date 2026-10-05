package dev.forthtilliath.chat.room;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;

import dev.forthtilliath.chat.IntegrationTest;
import dev.forthtilliath.chat.message.MessageService;
import dev.forthtilliath.chat.user.LampColor;
import dev.forthtilliath.chat.user.SessionService;
import dev.forthtilliath.chat.user.dto.SessionRequest;
import dev.forthtilliath.chat.user.dto.SessionResponse;

@IntegrationTest
class RoomApiTest {

	@Autowired
	private MockMvc mvc;

	@Autowired
	private SessionService sessions;

	@Autowired
	private MessageService messages;

	@Test
	void countsUnreadMessagesUntilTheReaderCatchesUp() throws Exception {
		SessionResponse reader = sessions.open(new SessionRequest("r-reader", LampColor.MENTHE), null);
		SessionResponse writer = sessions.open(new SessionRequest("r-writer", LampColor.CITRON), null);
		messages.post(writer.user().id(), IntegrationTest.GENERAL, "Premier", null);
		long lastId = messages.post(writer.user().id(), IntegrationTest.GENERAL, "Second", null).id();

		mvc.perform(as(reader, get("/api/rooms")))
				.andExpect(jsonPath("$[?(@.name == 'general')].unread").value(2))
				.andExpect(jsonPath("$[?(@.name == 'general')].lastMessage.content").value("Second"));
		mvc.perform(as(writer, get("/api/rooms")))
				.andExpect(jsonPath("$[?(@.name == 'general')].unread").value(0));

		mvc.perform(as(reader, post("/api/rooms/" + IntegrationTest.GENERAL + "/read"))
				.contentType(MediaType.APPLICATION_JSON).content("{\"messageId\":" + lastId + "}"))
				.andExpect(status().isNoContent());
		mvc.perform(as(reader, get("/api/rooms")))
				.andExpect(jsonPath("$[?(@.name == 'general')].unread").value(0));
	}

	@Test
	void joiningARoomStartsWithoutBacklogUnread() throws Exception {
		SessionResponse user = sessions.open(new SessionRequest("r-joiner", LampColor.AZUR), null);

		mvc.perform(as(user, post("/api/rooms/" + IntegrationTest.ANGULAR + "/join"))).andExpect(status().isNoContent());
		mvc.perform(as(user, get("/api/rooms")))
				.andExpect(jsonPath("$[?(@.name == 'angular')].joined").value(true))
				.andExpect(jsonPath("$[?(@.name == 'angular')].unread").value(0));
		mvc.perform(as(user, get("/api/rooms/" + IntegrationTest.ANGULAR + "/members")))
				.andExpect(jsonPath("$[?(@.nickname == 'r-joiner')]").exists());
	}

	@Test
	void createsRoomsWithUniqueSlugNames() throws Exception {
		SessionResponse user = sessions.open(new SessionRequest("r-creator", LampColor.LILAS), null);
		String body = "{\"name\":\"r-signals\",\"topic\":\"  \"}";

		mvc.perform(as(user, post("/api/rooms")).contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.joined").value(true))
				.andExpect(jsonPath("$.memberCount").value(1))
				.andExpect(jsonPath("$.topic").doesNotExist());
		mvc.perform(as(user, post("/api/rooms")).contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isConflict());
		mvc.perform(as(user, post("/api/rooms")).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Pas Valide\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.name").exists());
	}

	@Test
	void generalCannotBeLeft() throws Exception {
		SessionResponse user = sessions.open(new SessionRequest("r-stayer", LampColor.AMBRE), null);
		mvc.perform(as(user, post("/api/rooms/" + IntegrationTest.GENERAL + "/leave")))
				.andExpect(status().isForbidden());
	}

	@Test
	void historyIsPaginatedOldestFirst() throws Exception {
		SessionResponse user = sessions.open(new SessionRequest("r-historian", LampColor.CORAIL), null);
		String url = "/api/rooms/" + IntegrationTest.ANGULAR + "/messages";

		String latest = mvc.perform(as(user, get(url + "?limit=2"))).andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
		List<Integer> latestIds = JsonPath.read(latest, "$[*].id");
		assertThat(latestIds).hasSize(2).isSorted();
		assertThat(JsonPath.<String>read(latest, "$[1].content")).startsWith("linkedSignal");

		String older = mvc.perform(as(user, get(url + "?limit=10&before=" + latestIds.getFirst())))
				.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
		List<Integer> olderIds = JsonPath.read(older, "$[*].id");
		assertThat(olderIds).hasSize(2).isSorted().allMatch(id -> id < latestIds.getFirst());
	}

	private static MockHttpServletRequestBuilder as(SessionResponse session, MockHttpServletRequestBuilder request) {
		return request.header(HttpHeaders.AUTHORIZATION, "Bearer " + session.token());
	}
}
