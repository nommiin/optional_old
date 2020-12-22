Optional = {
    Initialize: function() {

    },
    OpenFile: function( _file ) { _file = _file.file;
        // Parse for optional-related lines
        _file.codeEditor.session.setValue(Optional.ParseFileOpen(_file.code));
        //console.log(_file.codeEditor.session.getValue());

        // Hook into pre-save event
        let EditorSave = _file.codeEditor.save;
        _file.codeEditor.save = function() {
            let EditorCode = this.session.getValue();
            this.session.setValue(Optional.ParseFileSave(EditorCode));
            EditorSave.apply(this);
            this.session.setValue(EditorCode);
        }
    },
    ParseFileSave: function( _code ) {
        let Script = _code.split("\n");
        for(var i = 0; i < Script.length; i++) {
            let Line = Script[i], Offset = Line.indexOf("function");
            if (Offset > -1) {
                let Position = {Start: -1, End: -1};
                for(var j = Offset; j < Line.length; j++) {
                    if (Line[j] == "(") {
                        Position.Start = j + 1;
                        break;
                    }
                }

                for(var j = Line.length; j > 0; j--) {
                    if (Line[j] == ")") {
                        Position.End = j;
                        break;
                    }
                }

                let Arguments = Line.slice(Position.Start, Position.End).split(","), ArgumentNames = "";
                for(var j = 0, _j = 0; j < Arguments.length; j++) {
                    let ArgumentGet = Arguments[j].split("=");
                    ArgumentNames += ArgumentGet[0].trim() + (j < Arguments.length - 1 ? "," : "");
                    Script.splice((i + 1) - (_j--), 0, ArgumentGet[0].trim() + " ??= " + ArgumentGet[1].trim());
                }
                Script[i] = Line.slice(0, Position.Start) + ArgumentNames + Line.slice(Position.End);
                Script.splice(++i, 0, "//#!optional(" + Arguments.length + ") " + Line);
                i++;
            }
        }
        return Script.join("\n");
    },
    ParseFileOpen: function( _code ) {
        let Script = _code.split("\n");
        for(var i = 0; i < Script.length; i++) {
            let Line = Script[i];
            if (Line.startsWith("//#!optional") == true) {
                let Count = Line.slice("//#!optional".length + 1), Offset = Count.indexOf(")");
                Count = parseInt(Count.slice(0, Offset));

                Script[i - 1] = Line.slice("//#!optional(".length + (Offset + 1)).trim();
                Script.splice(i, Count + 1);
                i += Count + 1;

                console.log(Count);
            }
        }
        return Script.join("\n");
    }
};

(function() {
    GMEdit.register("optional", Optional.Initialize);
    GMEdit.on("fileOpen", Optional.OpenFile);
})();