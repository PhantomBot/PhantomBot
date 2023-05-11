{
  description = "A very basic flake";

  outputs = { self, nixpkgs }: let
    systems =
        [ "x86_64-linux" "x86_64-darwin" "aarch64-linux" "aarch64-darwin" ];
      forAllSystems = f:
        builtins.listToAttrs (map (name: {
          inherit name;
          value = f name;
        }) systems);

      version = "${
          self.shortRev or "dirty"
        }";

      # Memoize nixpkgs for different platforms for efficiency.
      nixpkgsFor = forAllSystems (system:
        import nixpkgs {
          inherit system;
          overlays = [ self.overlays.default ];
        });
  in {
    overlays.phantombot = final: prev: {
      phantombot_ivy_cache = final.callPackage ({ stdenv, jdk17, ant }:
      stdenv.mkDerivation {
        name = "phantombot-${version}-deps";
        src = self;
        nativeBuildInputs = [ ant jdk17 ];
        buildPhase = ''
          export SOURCE_DATE_EPOCH 
          ant -noinput -buildfile build.xml -Disdocker=false -Divy.home=/build/source/ivy ivy-retrieve 
        '';
        installPhase = ''
          mkdir $out
          cp -r ivy/lib $out
          cp -r ivy/cache $out
        '';
        SOURCE_DATE_EPOCH = 1;
        outputHashMode = "recursive";
        oututHashAlgo = "sha256";
        outputHash = "sha256-Nhhk8W+pU5SkWkNO+g5K9XAKgu4Esz6d+BVrh6jnd1o=";
      }) { };
      phantombot = final.callPackage ({ stdenv, jdk17, ant, phantombot_ivy_cache }:
      stdenv.mkDerivation {
        name =  "phantombot-${version}";
        src = self;
        nativeBuildInputs = [ ant jdk17 ];
        configurePhase = ''
          mkdir ivy
          cp -r ${phantombot_ivy_cache}/* ivy
          chmod -R +w ivy
        '';
        buildPhase = ''
          export SOURCE_DATE_EPOCH
          make build ANT_ARGS="-Disdocker=false -Doffline=1 -Divy.home=/build/source/ivy"
        '';
        installPhase = ''
          rm -r dist/PhantomBot-$BUILD_TYPE/java-runtime-*
          mkdir $out
          mv dist/PhantomBot-$BUILD_TYPE/* $out
        '';
        JAVA_TOOL_OPTIONS = "-Dfile.encoding=UTF8";
        SOURCE_DATE_EPOCH = 1;
        BUILD_TYPE = "custom";
        
      }) { };
    };
    overlays.default = self.overlays.phantombot;

    legacyPackages = forAllSystems (system: nixpkgsFor.${system});

  };
}
