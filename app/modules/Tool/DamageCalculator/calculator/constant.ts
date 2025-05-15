export const BUFF_KEYS: {
  藏品rune: {
    加算: string[];
    乘算: string[];
  };
  全局Buff: {
    直接加算: string[];
    直接乘算: string[];
    最终加算: string[];
    最终乘算: string[];
    buff_stack: string[];
  };
  战斗无关: string[];
} = {
  藏品rune: {
    加算: ["char_squad_attribute_add", "char_attribute_add", "enemy_attribute_add", "layer_char_attribute_add"],
    乘算: [
      "char_squad_attribute_mul",
      "char_attribute_mul",
      "char_skill_cost_mul",
      "char_squad_attribute_mul_ex",
      "layer_char_attribute_mul",
      "char_random_target_attribute",
      "layer_char_random_target_attribute",
      "enemy_attribute_mul",
    ],
  },
  全局Buff: {
    直接加算: ["char_ability_new_at_root"],
    直接乘算: ["char_ability_new"],
    最终加算: [],
    最终乘算: ["global_buff_normal"],
    buff_stack: ["global_buff_stack_base_one", "global_buff_stack"],
  },
  战斗无关: [
    "immediate_reward",
    "shop_discount_rarity",
    "layer_after_battle_data",
    "level_char_limit_add",
    "shop_discount_rarity",
    "battle_extra_recruit_ticket",
    "battle_extra_relic",
    "battle_extra_reward",
    "level_init_cost_add",
    "deck_card_buff",
    "up_reward",
    "gift_on_buy",
    "gift_on_sacrifice",
    "layer_after_battle_node",
    "extra_gold_from_chest",
    "node_into_reward",
    "recruit_cost",
    "direct_upgrade",
    "layer_inspiration",
    "layer_after_perfect_battle",
    "count_a_to_b",
    "char_specific_target_attribute_cost",
    "layer_battle_cost_inspiration",
    "item_cover_set",
    "battle_extra_drop",
    "layer_relic_owned",
    "memory_reward",
    "gain_on_perfect",
    "inspiration_extra_reward",
    "player_level_rewards",
    "add_node_refresh_count",
    "change_fragment_type_weight",
    "condition_node_into_reward",
    "alchemy_extra_reward",
    "set_force_reroll_type",
    "disaster_rate_up",
    "level_hidden_group_enable",
    "enemy_skill_attributedata_assign",
    "battle_fail_protect",
    "layer_portal_change_layer",
    "level_life_point_modify_scale",
    "level_cost_increase_time_mul",
    "upgrade_cost",
    "set_node_refresh_weight",
    "zone_into_reward",
    "zone_into_cost",
    "battle_expedition",
    "misc_add_env_system",
    "immediate_recruit",
    "expedition_extra_random_reward",
  ],
};
