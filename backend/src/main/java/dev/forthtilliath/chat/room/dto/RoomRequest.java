package dev.forthtilliath.chat.room.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RoomRequest(
		@NotBlank(message = "Donnez un nom au canal.")
		@Size(min = 2, max = 32, message = "2 à 32 caractères.")
		@Pattern(regexp = "[a-z0-9]+(-[a-z0-9]+)*", message = "Minuscules, chiffres et tirets (ex. angular-signals).")
		String name,
		@Size(max = 160, message = "160 caractères maximum.") String topic) {
}
