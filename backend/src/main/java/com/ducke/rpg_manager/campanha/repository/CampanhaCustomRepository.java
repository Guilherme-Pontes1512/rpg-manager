package com.ducke.rpg_manager.campanha.repository;

import com.ducke.rpg_manager.campanha.dtos.CampanhaResumoOutput;
import com.ducke.rpg_manager.campanha.dtos.CampanhaSearchInput;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CampanhaCustomRepository {

    Page<CampanhaResumoOutput> listarCampanhas(Pageable pageable, CampanhaSearchInput input, Long usuarioId);
}
