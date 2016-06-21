export module TypeScriptTools {

  // ReSharper disable InconsistentNaming
  declare var CodeMirror;
  export var CRLF = String.fromCharCode(13);
  export var QCRLF = ";" + String.fromCharCode(13);
  export var SPACE = String.fromCharCode(9);

  export function q(str: string): string {
    return "\"" + str + "\"";
  };

  export function qa(str: string): string {
    return "'" + str + "'";
  };

  // ReSharper restore InconsistentNaming

  export class GenerationTools {

    protected generateAutoGeneratedComment = (): string => {
      var html = "";

      html += this.writeLine();

      html += this.indent() + "//------------------------------------------------------------------------------"
        + CRLF + this.indent() + "// <auto-generated>"
        + CRLF + this.indent() + "//     This code was generated by a tool."
        + CRLF + this.indent() + "//     Runtime Version: 4.0.30319.34209"
        + CRLF + this.indent() + "//"
        + CRLF + this.indent() + "//     Changes to this file may cause incorrect behavior and will be lost if"
        + CRLF + this.indent() + "//     the code is regenerated."
        + CRLF + this.indent() + "// </auto-generated>"
        + CRLF + this.indent() + "//------------------------------------------------------------------------------" + CRLF;

      html += this.writeLine();

      return html;
    };
    indenti = 0;
    protected indent = (indent?: number, before?: boolean): string => {
      var html = "";

      if (indent && before)
        this.indenti += indent;

      for (var i = 0; i < this.indenti; i++) {
        html += SPACE;
      }

      if (indent && !before)
        this.indenti += indent;
      return html;
    };

    protected writeLine(line?: string, autoIndent?: boolean): string {
      if (autoIndent) {
        if (this.endsWith(line, "(") || this.endsWith(line, "{") || this.endsWith(line, "["))
          return this.indent(1) + line + CRLF;
        if (this.startsWith(line, ")") || this.startsWith(line, "}") || this.startsWith(line, "]"))
          return this.indent(-1, true) + line + CRLF;
      }
      return this.indent() + (line ? line : "") + CRLF;
    }

    protected writeLineI(line: string): string {
      this.indent(1);
      return this.indent(-1) + line + CRLF;
    }

    protected endsWith = (str: string, suffix: any): boolean => {
      return str.indexOf(suffix, str.length - suffix.length) !== -1;
    };

    protected startsWith = (str: string, prefix: any): boolean => {
      return str.indexOf(prefix) == 0;
    };
  }

  export class JavascriptGenerationTools extends GenerationTools {
    protected classof = (o: any): string => {
      if (o === null) {
        return null;
      }
      if (o === undefined) {
        return undefined;
      }
      return Object.prototype.toString.call(o).slice(8, -1).toLowerCase();
    };
    protected isFunction = (o: any): boolean => {
      return this.classof(o) === "function";
    };
    protected addAttribute = (list: string[], name: string, properties?: string[]) => {
      this.addLine(list, "[" + name + (properties ? "(" + properties.join(", ") + ")" : "") + "]");
    };
    protected addLine = (list: string[], line: string) => {
      list.push((list.length == 0 ? "" : "\n") + line);
    };
    protected generateComment = (description: string, params?: string[]): string => {
      var html = "";

      if (description == "")
        return html;

      var lastLine: number = -1;
      var lines: string[] = description.split("\n");

      // ReSharper disable DuplicatingLocalDeclaration
      for (var i = 0; i < lines.length; i++) {
        // ReSharper restore DuplicatingLocalDeclaration
        if (lines[i].trim() != "") {
          lastLine = i;
        }
      }

      if (lastLine == -1)
        return html;

      html += "/**" + lines[0];

      // ReSharper disable DuplicatingLocalDeclaration
      for (var i = 1; i < lastLine + 1; i++) {
        // ReSharper restore DuplicatingLocalDeclaration
        html += CRLF + lines[i];
      }

      if (params) {
        html += CRLF;
        // ReSharper disable DuplicatingLocalDeclaration
        for (var i = 0; i < params.length; i++) {
          // ReSharper restore DuplicatingLocalDeclaration
          html += CRLF + "@param " + params[i];
        }
      }

      html += CRLF + "*/" + CRLF;

      return html;
    };
  }

  export class TypeScriptGenerationTools extends JavascriptGenerationTools {

    // ReSharper disable InconsistentNaming
    protected createObject = (type: string, name: string, _extends: string[], _implements: string[], inner: () => string, extraPad?: boolean): string => {
      // ReSharper restore InconsistentNaming
      var html = "";

      html += this.indent(1) + (type != null ? type + " " : "") + name + CRLF;

      if (_extends && _extends.length != 0) {
        html += this.indent() + "extends " + _extends.join(", ") + CRLF;
      }
      if (_implements && _implements.length != 0) {
        html += this.indent() + "implements " + _implements.join(", ") + CRLF;
      }

      var innerhtml = inner == null ? "" : inner();

      if (innerhtml == "") {
        html = html.substring(0, html.length - 1) + " { }" + CRLF;
        this.indent(-1);
      } else {
        html = html.substring(0, html.length - 1) + " {" + CRLF;
        this.indent(1);
        html += innerhtml;
        if (html.lastIndexOf(CRLF) != html.length - 1) {
          html += CRLF;
        }
        html += this.indent(-2, true) + "}" + CRLF;
      }

      if (extraPad)
        html += this.writeLine();

      return html;
    }

  }

  export class TypeScriptGenerator extends TypeScriptGenerationTools {

    static defaultOptions = <TypeScriptGeneratorOptions>{
      prettify: true,
      module: null,
      wrapWithInternal: true,
      interfacePreName: "IBreeze",
      internalModule: "_IntDefs",
      lowerCaseProperties: true,
      hasCustomExtends: true,
      customInhertianceModule: EntityExtends,
      extendsAlias: "_IntDefExts",
      generatePropertyComments: true,
      hideAbstracts: true,
      internalAbstractModule: "AbstractDefs",
      //restrictToNamespace: "SN.withSIX.App.ApiModel",
      printNamespace: false,
      generateGraph: true,
      generateInit: true,
      generateFakeCtors: true
    };

    log = Tools.Debug.generateDebugForName("TSGen");

    constructor(private metadataUri: string, private options?: TypeScriptGeneratorOptions) {
      super();
      if (options == null) {
        this.log.debug("Options not specified in constructor, falling back to defaults");
        this.options = TypeScriptGenerator.defaultOptions;
      }
      if (this.options.hasCustomExtends)
        if (this.options.customInhertianceModule) {
          if (!this.options.customInhertianceModule.hasOwnProperty("_ExtendsHelper"))
            throw new Error("Custom Inheritence Specified without Helper Class");
          if (!this.options.customInhertianceModule._ExtendsHelper.hasOwnProperty("$namespace"))
            throw new Error("Custom Inheritence Specified, Extends Helper has no namespace definition");
        } else {
          throw new Error("Custom Extends were set to true but the inheritance module was null.");
        }

      if (this.options.lowerCaseProperties) {
        this.log.log("Lowercase properties set to True");
        breeze.NamingConvention.camelCase.setAsDefault();
      }

    }

    public entityManager: breeze.EntityManager;

    //#region Public Functions

    public printTypeScript(element: HTMLElement) {
      this.entityManager = new breeze.EntityManager(this.metadataUri);
      this.entityManager.fetchMetadata().then(() => {
        this.printMetadata(element);
      });
    }

    public setMetadata(metadata: string) {
      var dataService = new breeze.DataService({
        serviceName: this.metadataUri,
        hasServerMetadata: false
      });
      var metadataStore = new breeze.MetadataStore({
        namingConvention: breeze.NamingConvention.camelCase
      });

      this.log.log("Importing Metadata");
      metadataStore.importMetadata(metadata);
      this.log.log("Imported Metadata");

      this.entityManager = new breeze.EntityManager({
        metadataStore: metadataStore
      });
    }

    public getTypeScriptFromMetadata(metadata: string): string {
      var dataService = new breeze.DataService({
        serviceName: this.metadataUri,
        hasServerMetadata: false
      });
      var metadataStore = new breeze.MetadataStore({
        namingConvention: breeze.NamingConvention.camelCase
      });

      this.log.log("Importing Metadata");
      metadataStore.importMetadata(metadata);
      this.log.log("Imported Metadata");

      this.entityManager = new breeze.EntityManager({
        metadataStore: metadataStore
      });

      return this.getTypescriptOutput();
    }

    public getTypescriptOutput = (): string => {
      var html = "";

      html += `
            import {W6} from './withSIX'
import breeze from 'breeze-client';

import {EntityExtends} from './entity-extends';
export * from './entity-extends';

// DTOS
`

      html += this.indent() + "// ReSharper disable InconsistentNaming" + CRLF;

      if (this.options.module) {
        this.log.log("Creating Module: " + this.options.module);
        html += this.createObject("module", this.options.module, [], [], this.createModuleInner);
      } else {
        html += this.createModuleInner();
      }

      html += this.indent() + "// ReSharper restore InconsistentNaming" + CRLF;

      return html;
    }; //#endregion

    printMetadata = (element: HTMLElement) => {
      var code = document.createElement('textarea');
      code.innerHTML = this.getTypescriptOutput();
      $(code).attr("id", "code");
      $(code).attr("name", "code");
      $(element).append($(code));

      if (this.options.prettify) {
        var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
          lineNumbers: true,
          matchBrackets: true,
          mode: "text/typescript"
        });

        //editor.setValue(html);
      }

      //Debug.log(html);
    };
    createModuleInner = (): string => {
      var html = "";

      html += this.generateAutoGeneratedComment();

      if (this.options.customInhertianceModule) {
        html += this.indent() + "import " + this.options.extendsAlias + " = " + this.options.customInhertianceModule._ExtendsHelper.$namespace + QCRLF + CRLF;
      }

      if (this.options.wrapWithInternal) {
        html += this.generateAbstractInterfaces();
      } else {
        html += this.generateHiddenAbstracts();
      }

      if (this.options.generateInit) {
        if (this.options.generateFakeCtors) {
          html += this.generateFakeCtors();
        }
        html += this.createObject("export class", "BreezeInitialzation", [], [], this.generateInitClass);
      }

      if (this.options.generateGraph) {
        html += this.createObject("export module", "BreezeEntityGraph", [], [], this.generateEntityGraph);
      }

      if (this.options.wrapWithInternal) {
        html += this.createObject("export module", this.options.internalModule, [], [], this.generateInterfaceDefinitions);
      } else {
        html += this.generateInterfaceDefinitions();
      }

      return html;
    }; //#region Initialise Class Generation

    generateFakeCtors = (): string => {
      var html = "", todo: any[] = [], types = this.entityManager.metadataStore.getEntityTypes();

      types.forEach((item, index, array) => {
        if (!this.typeHasCtor(item))
          todo.push(item);
      });

      if (todo.length > 0)
        html += this.createObject("export module", "_InternalFakeCtors", [], [], () => this.generateFakeCtorsInner(todo));

      return html;
    };
    generateFakeCtorsInner = (types: any[]): string => {
      var html = "";

      types.forEach((item, index, array) => {
        html += this.createObject("export class", item.shortName, [], [], () => "");
      });

      return html;
    };
    generateInitClass = (): string => {
      var html = "";

      if (this.options.customInhertianceModule)
        html += this.createObject("static", "registerEntityTypeCtors(store: breeze.MetadataStore)", [], [], this.generateCtorRegistry);

      return html;
    };
    generateCtorRegistry = (): string => {
      var html = "", types = this.entityManager.metadataStore.getEntityTypes();

      for (var i = 0; i < types.length; i++) {
        var type = <any>types[i];
        var line = this.generateCtorClassRegister(type);

        if (line != "")
          html += this.indent() + line + CRLF;
      }

      return html;
    };
    generateCtorClassRegister = (type: any): string => {
      var name = type.shortName;

      if (!this.typeHasCtor(type)) {
        if (this.options.generateFakeCtors) {
          //this.log.info("Registering Fake Ctor for Entity.", "Entity: '" + type.shortName + "'");
          return "store.registerEntityTypeCtor(" + qa(name) + ", " + "_InternalFakeCtors." + type.shortName + ");";
        } else
          return "";
      } else {
        if (this.options.customInhertianceModule[type.shortName].hasOwnProperty("$name")) {
          name = this.options.customInhertianceModule[type.shortName].$name;
          this.log.debug("Registering Ctor with Alternative Name.", "Entity: " + qa(type.shortName), "Registered With: " + qa(name) + "");
        }
        return "store.registerEntityTypeCtor(" + qa(name) + ", " + this.options.customInhertianceModule._ExtendsHelper.$namespace + "." + type.shortName + ");";
      }
    };
    typeHasCtor = (type: any): boolean => {
      return this.options.customInhertianceModule.hasOwnProperty(type.shortName);
    }; //#endregion

    //#region EntityGraph Generation

    generateEntityGraph = (): string => {
      var html = "", types = this.entityManager.metadataStore.getEntityTypes();

      html += this.indent() + "var defaultEntityManager: breeze.EntityManager" + QCRLF;

      html += this.writeLine();

      html += this.indent(1) + "export var initialize = (entityManager: breeze.EntityManager) => {" + CRLF;
      html += this.indent(1) + "if(defaultEntityManager != null)" + CRLF;
      html += this.indent(-1) + "throw new Error(" + qa("EntityGraph has already been initialized") + ")" + QCRLF;
      html += this.indent(-1) + "defaultEntityManager = entityManager" + QCRLF;
      html += this.indent() + "}" + QCRLF;

      html += this.writeLine();

      for (var i = 0; i < types.length; i++) {
        var type = <any>types[i];


        html += this.createObject("export class", type.shortName, [], [], () => this.generateGraphForType(type));
      }

      return html;
    };
    generateGraphForType = (type: any): string => {
      var html = "";
      //
      html += this.indent() + "static $name: string = " + q(type.shortName) + QCRLF;
      html += this.indent() + "$name: string = " + q(type.shortName) + QCRLF;
      html += this.indent() + "$type: string = " + q(type.shortName) + QCRLF;

      html += this.writeLine();

      html += this.createObject("", "constructor(name: string)", [], [], () => this.generateEntityGraphTypeCtor(type));

      html += this.writeLine();

      for (var j = 0; j < type.navigationProperties.length; j++) {
        var property = type.navigationProperties[j];

        html += this.indent() + "static " + this.generatePN(property) + " = (): " + property.entityType.shortName + " => new " + property.entityType.shortName + "(" + q(this.generatePN(property)) + ")" + QCRLF;
      }

      if (type.navigationProperties.length != 0)
        html += this.writeLine();

      for (var j = 0; j < type.navigationProperties.length; j++) {
        var property = type.navigationProperties[j];

        html += this.indent() + "" + this.generatePN(property) + " = (): " + property.entityType.shortName + " => new " + property.entityType.shortName + "(this.$name + " + q(".") + " + " + q(this.generatePN(property)) + ")" + QCRLF;
      }

      if (type.navigationProperties.length != 0)
        html += this.writeLine();

      html += this.generateCreateEntityFunction(type, "static");

      html += this.writeLine();

      html += this.generateCreateEntityFunction(type, "public");

      return html;
    };

    generateCreateEntityFunction(type: any, visibility: string): string {
      var html = "";

      var outType = this.generateCNRef(type);
      var configType = this.generateCNRef(type, true, "_opt");

      html += this.indent() + visibility + " createEntity(entityManager: breeze.EntityManager, config?: " + configType + "): " + outType + QCRLF;
      html += this.indent() + visibility + " createEntity(config?: " + configType + "): " + outType + QCRLF;

      html += this.createObject(visibility, "createEntity(entityManagerOrConfig: any, config?: " + configType + "): " + outType, [], [], () => {
        var html = "";

        html += this.indent() + "if (typeof entityManagerOrConfig == typeof breeze.EntityManager || config != null) {" + CRLF;
        html += this.indent(1, true) + "    return <" + outType + "> entityManagerOrConfig.createEntity(" + q(type.shortName) + ", config)" + QCRLF;
        html += this.indent(-1, true) + "} else {" + CRLF;
        html += this.indent(1, true) + "    return <" + outType + "> defaultEntityManager.createEntity(" + q(type.shortName) + ", entityManagerOrConfig)" + QCRLF;
        html += this.indent(-1, true) + "}" + CRLF;

        return html;
      });

      return html;
    }

    generateEntityGraphTypeCtor = (type: any): string => {
      var html = "";

      html += this.indent() + "this.$name = name" + QCRLF;

      return html;
    }; //#endregion

    //#region Interface Generation

    generateAbstractInterfaces = (): string => {
      var html = "", types = this.entityManager.metadataStore.getEntityTypes();

      for (var i = 0; i < types.length; i++) {
        html += this.generateAbstractInterface(<any>types[i], true);
      }

      html += this.generateHiddenAbstracts();

      return html;
    };
    generateHiddenAbstracts = (): string => {
      var html = "", types = this.entityManager.metadataStore.getEntityTypes();

      if (this.options.hideAbstracts) {
        html += this.createObject("export module", this.options.internalAbstractModule, null, null, () => {
          // ReSharper disable once DuplicatingLocalDeclaration
          var html = "";
          for (var i = 0; i < types.length; i++) {
            html += this.generateAbstractInterface(<any>types[i], false);
          }
          return html;
        });
      }

      return html;
    };
    generateAbstractInterface = (type: any, hideAbstract: boolean): string => {
      var html = "", extendList = [];

      if (this.options.restrictToNamespace && type.namespace != this.options.restrictToNamespace)
        return "";
      if ((this.options.hideAbstracts && (hideAbstract && type.isAbstract))
        || (this.options.hideAbstracts && (!hideAbstract && !type.isAbstract)))
        return "";

      if ((this.options.hideAbstracts && (!hideAbstract && type.isAbstract) && !this.options.wrapWithInternal)) {
        html += this.generateComment((type.isAbstract ? 'Abstract\n\n' : '') + this.getTypeNS(type));
        return this.generateInterfaceDefinition(type);
      }

      extendList.push(this.generateCNRef(type, true));

      if (type.hasOwnProperty('baseEntityType')) {
        extendList.push(this.generateCNRef(type.baseEntityType));
      }

      if (this.options.wrapWithInternal) {
        var cExtend = this.generateCustomExtends(type);
        if (cExtend != "") {
          extendList.push(CRLF + this.indent(2, true) + cExtend);
          this.indent(-2);
        }

      }

      html += this.generateComment((type.isAbstract ? 'Abstract\n\n' : '') + this.getTypeNS(type));
      html += this.createObject("export interface", this.generateCN(type), extendList, [], null, true);

      return html;
    };
    generateInterfaceDefinitions = (): string => {
      var html = "", types = this.entityManager.metadataStore.getEntityTypes();

      for (var i = 0; i < types.length; i++) {
        html += this.generateInterfaceDefinition(<any>types[i]);
      }

      return html;
    };
    generateInterfaceDefinition = (type: any): string => {
      var html = "";

      if (this.options.restrictToNamespace && type.namespace != this.options.restrictToNamespace)
        return "";

      var generateExtends = (forceOptional?: boolean) => {
        var extendList = [];
        if (forceOptional) {
          if (type.hasOwnProperty('baseEntityType'))
            extendList.push(this.generateCNRef(type.baseEntityType, true, "_opt"));
        } else {
          extendList.push((type.hasOwnProperty('baseEntityType') ? this.generateCNRef(type.baseEntityType, true) : 'breeze.Entity'));
        }


        if (!this.options.wrapWithInternal) {
          var cExtend = this.generateCustomExtends(type);
          if (cExtend != "") {
            extendList.push(CRLF + this.indent(1, true) + cExtend);
            this.indent(-1);
          }
        }
        return extendList;
      };

      html += this.createObject("export interface", this.generateCN(type, true), generateExtends(), null, () => this.generateProperties(type), true);
      if (this.options.generateGraph)
        html += this.createObject("export interface", this.generateCN(type, true, "_opt"), generateExtends(true), null, () => this.generateProperties(type, true), true);

      return html;
    }; //#endregion

    //#region Property Generation

    generateProperties = (type: any, forceOptional?: boolean): string => {
      var html = "";

      html += this.generateDataProperties(type, forceOptional);
      html += this.generateNavigationProperties(type, forceOptional);

      return html;
    };
    generateDataProperties = (type: any, forceOptional?: boolean): string => {
      var html = "";

      if (this.typeDataPCount(type) > 0) {
        html += this.indent() + "//Data Properties" + CRLF;
      }

      for (var j = 0; j < type.dataProperties.length; j++) {
        var property = <any>type.dataProperties[j];
        if (type.baseEntityType && type.baseEntityType.dataProperties.filter(function(p) { return p.name === property.name; }).length > 0)
          continue;
        html += this.generateDataPropertyComment(property);
        html += this.indent() + this.generatePN(property);
        if (forceOptional || property.isNullable || (property.isPartOfKey && property.parentType.autoGeneratedKeyType.name == "Identity"))
          html += '?';
        html += ': ' + this.getJSType(property.dataType.name);
        html += '; //' + property.dataType.name + CRLF;
      }

      return html;
    };
    generateNavigationProperties = (type: any, forceOptional?: boolean): string => {
      var html = "";

      if (this.typeNavPCount(type) > 0) {
        if (this.typeDataPCount(type) > 0)
          html += this.writeLine();
        html += this.indent() + "//Navigation Properties" + CRLF;
      }

      for (var j = 0; j < type.navigationProperties.length; j++) {
        var property = type.navigationProperties[j];
        if (type.baseEntityType && type.baseEntityType.navigationProperties.filter(p => p.name === property.name).length > 0)
          continue;
        html += this.generateNavigationPropertyComment(property);
        //if (property.isPartOfKey)
        //    html += this.generateComment("[Key]");
        html += this.indent() + this.generatePN(property);
        if (forceOptional || property.isNullable)
          html += '?';
        html += ': ' + this.generateCNRef(property.entityType);
        if (property.isScalar)
          html += QCRLF;
        else
          html += '[]' + QCRLF;
      }
      return html;
    };
    generateDataPropertyComment = (property: any): string => {
      // ReSharper disable UnusedLocals, AssignedValueIsNeverUsed
      var description = "",
        items: string[] = [],
        prop = <breeze.DataProperty>property,
        add = (name: string, properties?: string[]) => this.addAttribute(items, name, properties);
      // ReSharper restore UnusedLocals, AssignedValueIsNeverUsed

      items.push("(" + property.dataType.name + ")");
      if (property.isPartOfKey)
        items.push("[Key]");
      if (!property.isSettable)
        items.push("[ReadOnly]");
      if (property.isPartOfKey && property.parentType.autoGeneratedKeyType.name != "None")
        add("DatabaseGenerated", [property.parentType.autoGeneratedKeyType.name]);
      if (property.relatedNavigationProperty)
        add("ForeignKey", [q(property.relatedNavigationProperty.name)]);

      if (prop.validators.length > 0)
        items.push("\n\nValidation:");

      for (var i = 0; i < prop.validators.length; i++) {
        var validator = prop.validators[i];
        this.addLine(items, " - " + validator.name + ": " + q(this.formatTemplate(validator.context.messageTemplate, validator.context)));
        //Debug.log(validator);
      }

      description = items.join(" ");

      return (description == "" ? "" : this.generateComment(description));
    };
    generateNavigationPropertyComment = (property: any): string => {
      // ReSharper disable UnusedLocals, AssignedValueIsNeverUsed
      var description = "",
        items: string[] = [],
        add = (name: string, properties?: string[]) => this.addAttribute(items, name, properties);
      // ReSharper restore UnusedLocals, AssignedValueIsNeverUsed

      items.push("(" + this.generateCNRef(property.entityType) + ")");
      if (property.isPartOfKey)
        items.push("[Key]");

      description = items.join(" ");

      return (description == "" ? "" : this.generateComment(description));
    }; //#endregion

    //#region Helpers


    // ReSharper disable once InconsistentNaming
    getJSType = (metadataType: string): string => {
      if (/(Int64)|(Int32)|(Int16)|(Byte)|(Decimal)|(Double)|(Single)|(number)/.test(metadataType))
        return 'number';
      else if (/(DateTime)|(DateTimeOffset)|(Time)|(Date)/.test(metadataType))
        return 'Date';
      else if (/(Boolean)/i.test(metadataType))
        return 'boolean';
      return 'string';
    }; // ReSharper disable once InconsistentNaming
    generateCNRef = (type: any, internal?: boolean, prepend?: string, postend?: string): string => {
      if (internal && this.options.wrapWithInternal) {
        return this.options.internalModule + "." + "_" + (prepend ? prepend + "_" : "") + type.shortName + (postend ? "_" + postend : "");
      } else {
        return (this.options.hideAbstracts && type.isAbstract ? this.options.internalAbstractModule + "." : "") + (this.options.interfacePreName ? this.options.interfacePreName : "") + (prepend ? prepend + "_" : "") + type.shortName + (postend ? "_" + postend : "") + (this.options.interfacePostName ? this.options.interfacePostName : "");
      }
    }; // ReSharper disable once InconsistentNaming
    generateCN = (type: any, internal?: boolean, prepend?: string, postend?: string): string => {
      if (internal && this.options.wrapWithInternal) {
        return "_" + (prepend ? prepend + "_" : "") + type.shortName + (postend ? "_" + postend : "");
      }
      return (this.options.interfacePreName ? this.options.interfacePreName : "") + (prepend ? prepend + "_" : "") + type.shortName + (postend ? "_" + postend : "") + (this.options.interfacePostName ? this.options.interfacePostName : "");
    }; // ReSharper disable once InconsistentNaming
    generatePN = (property: any): string => {
      return property.name;
    }; // ReSharper disable once InconsistentNaming
    getTypeNS = (type: any, force?: boolean): string => {
      return (force || this.options.printNamespace ? type.namepsace : "");
    };
    typeNavPCount = (type: any, inherited?: boolean): number => {
      if ((inherited == undefined || inherited == false) && type.baseEntityType) {
        return type.navigationProperties.length - type.baseEntityType.navigationProperties.length;
      } else {
        return type.navigationProperties.length;
      }
    };
    typeDataPCount = (type: any, inherited?: boolean): number => {
      if ((inherited == undefined || inherited == false) && type.baseEntityType) {
        return type.dataProperties.length - type.baseEntityType.dataProperties.length;
      } else {
        return type.dataProperties.length;
      }
    };
    formatTemplate = (template: any, vars: any, ownPropertiesOnly?: boolean): string => {
      if (!vars) return template;
      return template.replace(/%([^%]+)%/g, (_, key) => {
        var valOrFn;
        if (ownPropertiesOnly) {
          valOrFn = vars.hasOwnProperty(key) ? vars[key] : '';
        } else {
          valOrFn = vars[key];
        }
        if (valOrFn != null) {
          if (this.isFunction(valOrFn)) {
            return valOrFn(vars);
          } else {
            return valOrFn;
          }
        } else {
          return "";
        }
      });
    };
    generateCustomExtends = (type: any) => {
      // ReSharper disable UnusedLocals
      var html = "";
      // ReSharper restore UnusedLocals

      if (!this.options.customInhertianceModule)
        return html;

      if (!this.options.customInhertianceModule.hasOwnProperty(type.shortName))
        return html;

      return this.options.extendsAlias + ".I" + type.shortName;
    }; //#endregion
  }


  // ReSharper disable once InconsistentNaming
  export interface TypeScriptGeneratorOptions {
    prettify: boolean;
    module?: string;
    wrapWithInternal?: boolean;
    interfacePreName?: string;
    interfacePostName?: string;
    internalModule?: string;
    lowerCaseProperties?: boolean;
    hasCustomExtends?: boolean;
    customInhertianceModule?: any;
    extendsAlias?: string;
    generatePropertyComments?: boolean;
    internalAbstractModule?: string;
    hideAbstracts?: boolean;
    restrictToNamespace?: string;
    printNamespace?: boolean;
    generateGraph?: boolean;
    generateInit?: boolean;
    generateFakeCtors?: boolean;
  }


  export class CSharpGenerationTools extends GenerationTools {
    // ReSharper disable InconsistentNaming
    protected createObject = (type: string, name: string, _extends: string[], _implements: string[], inner: () => string, extraPad?: boolean): string => {
      // ReSharper restore InconsistentNaming
      var html = "";

      html += this.indent(1) + (type != null ? type + " " : "") + name + CRLF;

      if (_extends && _extends.length != 0) {
        html += this.indent() + ": " + _extends.join(", ") + CRLF;
      }
      if (_implements && _implements.length != 0) {
        html += this.indent() + (_extends.length == 0 ? "implements " : ", ") + _implements.join(", ") + CRLF;
      }

      var innerhtml = inner == null ? "" : inner();

      if (innerhtml == "") {
        html = html.substring(0, html.length - 1) + " { }" + CRLF;
        this.indent(-1);
      } else {
        html = html.substring(0, html.length - 1) + " {" + CRLF;
        this.indent(1);
        html += innerhtml;
        if (html.lastIndexOf(CRLF) != html.length - 1) {
          html += CRLF;
        }
        html += this.indent(-2, true) + "}" + CRLF;
      }

      if (extraPad)
        html += this.writeLine();

      return html;
    }
  }

  export class BundleProcessorGenerator extends CSharpGenerationTools {

    options: BundleProcessorOptions;

    constructor(private metadataUri: string) {
      super();

      this.options = <BundleProcessorOptions>{
        namespace: "SN.withSIX.Presentation.UseCases.BundleProcessors",
        usings: [
          "System",
          "System.Threading.Tasks",
          "Newtonsoft.Json.Linq",
          "SN.withSIX.App.ApiModel",
          "SN.withSIX.App.Infrastructure",
          "SN.withSIX.App.UseCases.Admin",
          "SN.withSIX.App.UseCases.Connect"
        ]
      };
    }

    log = Tools.Debug.generateDebugForName("BundleGen");
    entityManager: breeze.EntityManager;

    public getBundleProcessorFromMetadata(metadata: string): string {
      var dataService = new breeze.DataService({
        serviceName: this.metadataUri,
        hasServerMetadata: false
      });
      var metadataStore = new breeze.MetadataStore({
        namingConvention: breeze.NamingConvention.camelCase
      });

      this.log.log("Importing Metadata");
      metadataStore.importMetadata(metadata);
      this.log.log("Imported Metadata");

      this.entityManager = new breeze.EntityManager({
        metadataStore: metadataStore
      });

      return this.getOutput();
    }

    getOutput = (): string => {
      var html = "";

      //html += this.writeLine("// ReSharper disable InconsistentNaming, RedundantNameQualifier");

      this.options.usings.forEach((v, i, arr) => {
        html += this.writeLine("using " + v + ";");
      });

      html += this.createObject("namespace", this.options.namespace, [], [], this.createNSInner);

      //html += this.writeLine("// ReSharper restore InconsistentNaming, RedundantNameQualifier");

      return html;

    };
    createNSInner = (): string => {
      var html = "";

      html += this.createObject("abstract class", "BundleProcessorBase", ["BundleProcessorBaseNG"], null, this.createBundleProcessorClass);

      return html;
    };

    createBundleProcessorClass = (): string => {
      var html = "";

      html += this.writeLine("public BundleProcessorBase(ISqlContext context, IUploadPolicyGenerator uploadPolicyGenerator) : base(context, uploadPolicyGenerator) {  }");

      html += this.writeLine();

      html += this.createObject("protected override Task", "ProcessEntity(JToken e)", null, null, this.createProcessEntity);
      html += this.writeLine();

      html += this.generateInternalSaves();

      html += this.writeLine();
      //html += this.writeLine("// ReSharper disable InconsistentNaming, UnusedParameter.Global, VirtualMemberNeverOverriden.Global");
      html += this.generateVirtualSaves();
      //html += this.writeLine("// ReSharper restore InconsistentNaming, UnusedParameter.Global, VirtualMemberNeverOverriden.Global");

      return html;
    };
    createProcessEntity = (): string => {
      var html = "";

      html += this.writeLine("var entityType = GetEntityTypeName(e);");

      html += this.writeLine();

      html += this.writeLine("try {", true);

      html += this.writeLine("switch (entityType)", true);
      html += this.writeLine("{", true);

      html += this.generateSwitchStatement();

      html += this.writeLine("default:");
      html += this.writeLineI("throw new NotImplementedException(entityType + \" not supported\");");

      html += this.writeLine("}", true);
      //default:
      //


      html += this.writeLine("} catch (NotImplementedException ex) {", true);
      html += this.writeLine("throw new NotImplementedException(entityType + \" not supported\", ex);", true);
      html += this.writeLine("}", true);
      //html += this.createObject("abstract class", "BundleProcessorBase", ["BundleProcessorBaseNG"], null, this.createBundleProcessorClass);

      return html;
    };

    generateSwitchStatement = (): string => {
      var html = "", todo: any[] = [], types = this.entityManager.metadataStore.getEntityTypes();

      types.forEach((v, i, arr) => {
        html += this.writeLine("case " + q(v.shortName) + ":");
        html += this.writeLineI("return Save" + v.shortName + "TypeInternal(e);");
      });

      return html;
    };
    generateInternalSaves = (): string => {
      var html = "", todo: any[] = [], types = this.entityManager.metadataStore.getEntityTypes();

      types.forEach((v, i, arr) => {
        html += this.createObject("private Task", "Save" + v.shortName + "TypeInternal(JToken e)", null, null, () => {
          var html = "";

          html += this.writeLine("return Save" + v.shortName + "Type(e.ToObject<" + v.namespace + "." + v.shortName + ">(), GetEntityState(e), " + q(v.namespace + "." + v.shortName + ", " + v.namespace) + ");");

          return html;
        });
      });

      return html;
    };
    generateVirtualSaves = (): string => {
      var html = "", todo: any[] = [], types = this.entityManager.metadataStore.getEntityTypes();

      types.forEach((v, i, arr) => {
        html += this.createObject("protected virtual Task", "Save" + v.shortName + "Type(" + v.namespace + "." + v.shortName + " entity, string entityState, string entityFQN)", null, null, () => {
          var html = "";

          html += this.writeLine("throw new NotImplementedException();");

          return html;
        });
      });

      return html;
    };
  }

  export interface BundleProcessorOptions {
    namespace: string;
    usings: string[];
  }
}
