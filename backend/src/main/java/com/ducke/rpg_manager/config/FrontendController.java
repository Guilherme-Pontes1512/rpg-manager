package com.ducke.rpg_manager.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class FrontendController {

    @GetMapping({"/login", "/cadastro"})
    public String frontend() {
        return "forward:/index.html";
    }
}
