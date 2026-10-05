package dev.forthtilliath.chat.room.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** Dernier message vu par le client dans le canal. */
public record ReadRequest(@NotNull @Positive Long messageId) {
}
