package dev.forthtilliath.chat.user.dto;

import dev.forthtilliath.chat.user.LampColor;
import dev.forthtilliath.chat.user.Nicknames;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record SessionRequest(
		@NotBlank(message = "Choisissez un indicatif.")
		@Pattern(regexp = Nicknames.PATTERN, message = Nicknames.RULE) String nickname,
		@NotNull(message = "Choisissez la couleur de votre voyant.") LampColor color) {
}
