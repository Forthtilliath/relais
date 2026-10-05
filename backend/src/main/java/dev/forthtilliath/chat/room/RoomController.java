package dev.forthtilliath.chat.room;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import dev.forthtilliath.chat.room.dto.ReadRequest;
import dev.forthtilliath.chat.room.dto.RoomRequest;
import dev.forthtilliath.chat.room.dto.RoomView;
import dev.forthtilliath.chat.user.ChatUser;
import dev.forthtilliath.chat.user.CurrentUser;
import dev.forthtilliath.chat.user.UserView;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

	private final RoomService rooms;

	public RoomController(RoomService rooms) {
		this.rooms = rooms;
	}

	@GetMapping
	public List<RoomView> list(@CurrentUser ChatUser user) {
		return rooms.list(user.getId());
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public RoomView create(@CurrentUser ChatUser user, @Validated @RequestBody RoomRequest request) {
		return rooms.create(user, request);
	}

	@PostMapping("/{id}/join")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void join(@CurrentUser ChatUser user, @PathVariable UUID id) {
		rooms.join(user, id);
	}

	@PostMapping("/{id}/leave")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void leave(@CurrentUser ChatUser user, @PathVariable UUID id) {
		rooms.leave(user, id);
	}

	@PostMapping("/{id}/read")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void read(@CurrentUser ChatUser user, @PathVariable UUID id, @Validated @RequestBody ReadRequest request) {
		rooms.markRead(user, id, request.messageId());
	}

	@GetMapping("/{id}/members")
	public List<UserView> members(@CurrentUser ChatUser user, @PathVariable UUID id) {
		return rooms.members(id);
	}
}
