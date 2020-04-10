APPLICATION ?= device_LORA

BOARD ?= b-l072z-lrwan1


######## from Makefile.test_common

ifneq (,$(wildcard $(CURDIR)/tests/.))
  DEFAULT_MODULE += test_utils_interactive_sync
endif

ifneq (,$(filter tests_driver_%,$(APPLICATION)))
  BOARD ?= samr21-xpro
endif


RIOTBASE ?= $(CURDIR)/../RIOT
QUIET ?= 1
# DEVELHELP enabled by default for all tests, set 0 to disable
DEVELHELP ?= 1

######



BOARD_WITHOUT_LORAMAC_RX := \
    arduino-mega2560 \
    i-nucleo-lrwan1 \
    stm32f0discovery \
    waspmote-pro \

LORA_DRIVER ?= sx1276
LORA_REGION ?= EU868

USEPKG += semtech-loramac
USEMODULE += $(LORA_DRIVER)

# load loramac RX if board supports it
ifeq (,$(filter $(BOARD),$(BOARD_WITHOUT_LORAMAC_RX)))
  USEMODULE += semtech_loramac_rx
endif

USEMODULE += auto_init_loramac
USEMODULE += shell
USEMODULE += shell_commands
USEMODULE += fmt
USEMODULE += xtimer

FEATURES_OPTIONAL += periph_eeprom

include $(RIOTBASE)/Makefile.include
