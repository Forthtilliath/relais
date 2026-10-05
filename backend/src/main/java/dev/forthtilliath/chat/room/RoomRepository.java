package dev.forthtilliath.chat.room;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, UUID> {

	Optional<Room> findByName(String name);

	boolean existsByName(String name);
}
