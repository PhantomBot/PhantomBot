/*
 * This file contains used variables and functions defined in PhantomBot.jar
 * (Basically adds them to the code completion and eliminates unresolved warnings)
 */

//noinspection JSUnusedGlobalSymbols
var $ = {
      hostname: '',
      botName: '',
      ownerName: '',
      channelName: '',
      tempdb: {
        SetString: function (table, section, key, value) {
        },
        GetString: function (table, section, key, value) {
        },
        SetInteger: function (table, section, key, value) {
        },
        GetInteger: function (table, section, key, value) {
        },
      },
      connmgr: {
        reconnectSession: function () {
        },
      },
      twitch: {
        GetStream: function () {
          return org.json.JSONObject;
        },
        GetChannel: function () {
          return org.json.JSONObject;
        },
        UpdateChannel: function () {
          return org.json.JSONObject;
        },
        GetUserFollowsChannel: function () {
          return org.json.JSONObject;
        },
      },
      subscribers: {
        addSubscriber: function () {
        },
        doRun: function () {
        },
      },
      followers: {
        addFollower: function () {
        },
      },
      youtube: {
        SearchForVideo: function () {
        },
        GetVideoLength: function () {
        },
      },
      musicplayer: {
        cue: function () {
        },
        currentId: function () {
        },
        currentVolume: function () {
        },
        pause: function () {
        },
        play: function () {
        },
        setVolume: function () {
        },
        stealSong: function () {
        },
      },
      username: {
        resolve: function () {
        },
      },
      bancache: {
        getReformedUsers: function () {
        },
        loadFromFile: function () {
        },
        syncToFile: function () {
        },
        addUser: function () {
        },
        removeUser: function () {
        },
      },
      inidb: {
        AddFile: function (filename) {
        },
        GetInteger: function () {
        },
        SaveAll: function (force) {
        },
        FileExists: function (fileName) {
        },
        GetBoolean: function (fileName, key, value) {
        },
        GetKeyList: function (fileName, section) {
          return [fileName, section];
        },
        RemoveFile: function (fileName) {
        },
        ReloadFile: function () {
        },
        GetFileList: function () {
        },
        exists: function (fileName, key) {
        },
        get: function (fileName, key) {
        },
        set: function (fileName, key, value) {
        },
        del: function (fileName, key) {
        },
        incr: function (fileName, key, amount) {
        },
        decr: function (fileName, key, amount) {
        },
      }
    },
    $api = {
      on: function () {
      },
      loadScriptR: function () {
      },
    },
    $script = {
      getPath: function () {
      },
    },
    java = {
      io: {
        FileInputStream: function () {
        },
        File: function () {
          return {
            length: function () {
            },
            mkdir: function () {
            },
            deleteOnExit: function () {
            },
            list: function () {
            },
          };
        },
        FileOutputStream: function () {
        },
        PrintStream: function () {
        },
      },
      util: {
        HashMap: {},
        Calendar: {
          HOUR: null,
          MINUTE: null,
          SECOND: null,
          MILLISECOND: null,
          DAY_OF_MONTH: null,
          getInstance: function () {
            return {};
          },
        },
        concurrent: {
          Executors: {
            newScheduledThreadPool: function () {
              return {
                scheduleAtFixedRate: function () {
                },
                purge: function () {
                },
                schedule: function () {
                  return {
                    cancel: function () {
                    },
                  };
                },
              };
            },
          },
          TimeUnit: {
            MILLISECONDS: '',
          },
        },
        regex: {
          Pattern: {},
        },
        Objects: null,
        Date: function () {
        },
        Scanner: function () {
          return {
            hasNextLine: function () {
            },
            nextLine: function () {
            },
          };
        },
        TimeZone: {
          getTimeZone: function () {
          },
          getAvailableIDs: function () {
          },
        }
      },
      lang: {
        System: {
          currentTimeMillis: function () {
          },
        },
        String: null,
        Runnable: {},
      },
      security: {
        SecureRandom: function () {
          return {
            nextInt: function () {
            },
          };
        }
      },
    },
    org = {
      json: {
        JSONObject: {
          put: function () {
          },
          getJSONObject: function () {
          },
          getJSONArray: function () {
          },
          getInt: function () {
          },
          isNull: function () {
          },
          getString: function () {
          },
          getBoolean: function () {
          },
          httpCode: null,
          exception: null,
        },
      },
      apache: {
        commons: {
          io: {
            FileUtils: {
              moveFileToDirectory: function () {
              }
            }
          }
        }
      }
    },
    Packages = {
      org: org,
      java: java,
      me: {
        mast3rplan: {
          phantombot: {
            event: {
              twitch: {
                subscriber: {
                  TwitchSubscribeEvent: function () {
                  },
                },
              },
              command: {
                CommandEvent: function () {
                },
              },
              EventBus: {
                instance: function () {
                  return {
                    post: function () {
                    },
                  };
                },
              },
            },
          },
        },
      },
      com: {
        gmt2001: {
          Console: {
            out: {
              println: function () {
              },
            },
            HttpRequest: {
              RequestType: {
                GET: null,
                getData: function () {
                  return {
                    success: null,
                  };
                },
              },
            }
          },
        },
      },
    },
    JavaAdapter = {};


String.prototype.equalsIgnoreCase = function (string) {
};
String.prototype.equals = function (string) {
};

Object.prototype.getNicks = function () {
  return {
    iterator: function () {
      return {
        hasNext: function () {
        },
        next: function () {
        },
      };
    },
  };
};
Object.prototype.getSender = function () {
};
Object.prototype.getCommand = function () {
};
Object.prototype.getArgs = function () {
};
Object.prototype.getTags = function () {
};
Object.prototype.getArguments = function () {
};
Object.prototype.getMessage = function () {
};
Object.prototype.getCapsCount = function () {
};
Object.prototype.getStateId = function () {
};
Object.prototype.getMode = function () {
};
Object.prototype.getAdd = function () {
};
Object.prototype.getChannel = function () {
  return {
    getName: function () {
    },
  };
};
Object.prototype.getUser = function () {
};
Object.prototype.setCommand = function () {
};
Object.prototype.getFollows = function () {
};
Object.prototype.getFollower = function () {
};
Object.prototype.getHoster = function () {
};
Object.prototype.getSubscriber = function () {
};