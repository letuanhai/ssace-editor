ace.define("ace/mode/sas_highlight_rules",[], function(require, exports, module){/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2012, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */
"use strict";
var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;
var sasHighlightRules = function () {
    this.$rules = {
        start: [{
                include: "#specialparser"
            }, {
                include: "#options"
            }, {
                include: "#globalstatement"
            }, {
                include: "#datastep"
            }, {
                include: "#ODSstatement"
            }, {
                include: "#sql"
            }, {
                include: "#procstep"
            }],
        "#globalstatement": [{
                token: "keyword.language.global.sas",
                regex: /\b(?:LIBNAME|FILENAME|X|FOOTNOTE\d*|TITLE\d*|DM|ENDSAS|DISPLAY|WINDOW)\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /;/,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }]
            }],
        "#ODSstatement": [{
                token: "storage.type.class.sas",
                regex: /\bODS\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /;/,
                        next: "pop"
                    }, {
                        token: "storage.type.function.sas",
                        regex: /\b(?:HTML|PDF|RTF|EXCEL|EXCELXP|PACKAGE|_ALL_ CLOSE|DOCUMENT|ESCAPECHAR|EXCLUDE|GRAPHICS|LAYOUT ABSOLUTE|REGION|LAYOUT GRIDDED|REGION|LAYOUT END|PATH|PREFERENCES|PROCLABEL|PROCTITLE|RESULTS|SELECT|SHOW|TEXT|TRACE|USEGOPT|VERIFY|DECIMAL_ALIGN|LISTING(?: +close)?|NO_DECIMAL_ALIGN|OUTPUT)\b/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.ods.sas",
                        regex: /\b(?:FILE|ID|ON|OFF|ANCHOR|ARCHIVE|ATTRIBUTES|BASE|BODY|CHARSET|CLOSE|CODE|CODEBASE|CONTENTS|CSSSTYLE|DOM|ENCODING|EVENT|EXCLUDE +(?:ALL|NONE)?|FRAME|GFOOTNOTE|NOGFOOTNOTE|GPATH|GTITLE|NOGTITLE|HEADTEXT|METATEXT|NEWFILE|OPTIONS|PAGE|PARAMETERS|PATH|RECORD_SEPARATOR|SELECT +(?:ALL|NONE)?|SHOW|STYLE|STYLESHEET|TEXT|TRANTAB)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#specialparser": [{
                include: "#double_quoted_string"
            }, {
                include: "#single_quoted_string"
            }, {
                include: "#block_comment_string"
            }, {
                include: "#line_comment_string"
            }, {
                include: "#macro"
            }, {
                include: "#constant"
            }, {
                include: "#format"
            }, {
                include: "#operator"
            }],
        "#options": [{
                token: "storage.type.class.sas",
                regex: /\boptions\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /;/,
                        next: "pop"
                    }, {
                        token: "keyword.language.options.sas",
                        regex: /\b(?:MFILE|(?:NO)?SYMBOLGEN|(?:NO)?MLOGIC|(?:NO)?MPRINT|(?:NO)?MLOGICNEST|PS|LS|NOQUOTELENMAX|ALIGNSASIOFILES|ANIMATION|ANIMDURATION|ANIMLOOP|ANIMOVERLAY|APPEND|APPLETLOC|AUTHPROVIDERDOMAIN|AUTOCORRECT|AUTOSAVELOC|BINDING|BOTTOMMARGIN|BUFNO|BUFSIZE|BYERR|(?:NO)?BYLINE|BYSORTED|CAPS|CARDIMAGE|CATCACHE|CBUFNO|(?:NO)?CENTER|CGOPTIMIZE|CHARCODE|CHKPTCLEAN|CLEANUP|CMPLIB|CMPMODEL|CMPOPT|COLLATE|COLOPHON|COLORPRINTING|COMPRESS|COPIES|CPUCOUNT|CPUID|CSTGLOBALLIB|CSTSAMPLELIB|DATAPAGESIZE|DATASTMTCHK|(?:NO)?DATE|DATESTYLE|DECIMALCONV|DEFLATION|DETAILS|DKRICOND|DKROCOND|DLCREATEDIR|DLDMGACTION|DMR|DMS|DMSEXP|DMSLOGSIZE|DMSOUTSIZE|DMSPGMLINESIZE|DMSSYNCHK|DSACCEL|DSNFERR|DTRESET|DUPLEX|ECHOAUTO|EMAILACKWAIT|EMAILAUTHPROTOCOL|EMAILFROM|EMAILHOST|EMAILID|EMAILPORT|EMAILPW|EMAILUTCOFFSET|ENGINE|ERRORABEND|ERRORBYABEND|ERRORCHECK|ERRORS|EVENTDS|EXPLORER|EXTENDOBSCOUNTER|FILESYNC|FIRSTOBS|FMTERR|FMTSEARCH|FONTEMBEDDING|FONTRENDERING|FONTSLOC|FORMCHAR|SASAUTOS|FORMDLIM|FORMS|HELPBROWSER|HELPENCMD|HELPHOST|HELPPORT|HOSTINFOLONG|HTTPSERVERPORTMAX|HTTPSERVERPORTMIN|IBUFNO|IBUFSIZE|INITCMD|INITSTMT|INSERT|INTERVALDS|INVALIDDATA|JPEGQUALITY|LABEL|LABELCHKPT|LABELCHKPTLIB|LABELRESTART|_LAST_|LEFTMARGIN|LINESIZE|LOGPARM|LRECL|MERGENOBY|MISSING|MSGLEVEL|MULTENVAPPL|NEWS|(?:NO)?NOTES|(?:NO)?NUMBER|OBS|ORIENTATION|OVP|PAGEBREAKINITIAL|PAGENO|PAGESIZE|PAPERDEST|PAPERSIZE|PAPERSOURCE|PAPERTYPE|PARM|PARMCARDS|PDFACCESS|PDFASSEMBLY|PDFCOMMENT|PDFCONTENT|PDFCOPY|PDFFILLIN|PDFPAGELAYOUT|PDFPAGEVIEW|PDFPASSWORD|PDFPRINT|PDFSECURITY|PRESENV|PRIMARYPROVIDERDOMAIN|PRINTERPATH|PRINTINIT|PRINTMSGLIST|QUOTELENMAX|REPLACE|REUSE|RIGHTMARGIN|RLANG|RSASUSER|S|S2|S2V|SASHELP|SASUSER|SEQ|SETINIT|SKIP|SOLUTIONS|SORTDUP|SORTEQUALS|SORTSIZE|SORTVALIDATE|(?:NO)?SOURCE|SOURCE2|SPOOL|STARTLIB|STEPCHKPT|STEPCHKPTLIB|STEPRESTART|STRIPESIZE|SUMSIZE|SVGAUTOPLAY|SVGCONTROLBUTTONS|SVGFADEIN|SVGFADEMODE|SVGFADEOUT|SVGHEIGHT|SVGMAGNIFYBUTTON|SVGPRESERVEASPECTRATIO|SVGTITLE|SVGVIEWBOX|SVGWIDTH|SVGX|SVGY|(?:NO)?SYNTAXCHECK|SYSPRINTFONT|TERMINAL|TERMSTMT|TEXTURELOC|(?:NO)?THREADS|TIMEZONE|TOPMARGIN|TRAINLOC|UBUFNO|UBUFSIZE|UPRINTCOMPRESSION|URLENCODING|USER|UTILLOC|UUIDCOUNT|UUIDGENDHOST|V6CREATEUPDATE|VALIDFMTNAME|VALIDMEMNAME|VALIDVARNAME|VARINITCHK|VARLENCHK|VBUFSIZE|VNFERR|WORK|WORKINIT|WORKTERM|YEARCUTOFF)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#datastep": [{
                token: "text",
                regex: /(^\s*|;\*)(?=data)\b/,
                caseInsensitive: true,
                push: [{
                        token: "storage.type.class.sas",
                        regex: /\b(?:run|(?=proc))\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        include: "#datastatement"
                    }]
            }],
        "#datastatement": [{
                include: "#datalookup"
            }, {
                include: "#dataassignment"
            }],
        "#datalookup": [{
                token: [
                    "storage.type.class.sas",
                    "keyword.general.lookup.sas"
                ],
                regex: /\b(?:(data)|(set|update|modify|merge))\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /;/,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        include: "#dataset"
                    }, {
                        include: "#check_balanced_bracket"
                    }]
            }],
        "#dataassignment": [{
                include: "#check_balanced_bracket"
            }, {
                include: "#controlStatement"
            }, {
                include: "#controlKeyword"
            }, {
                include: "#funcList"
            }, {
                include: "#operator"
            }, {
                include: "#constant"
            }, {
                include: "#format"
            }],
        "#funcList": [{
                token: "keyword.function-call.generic.sas",
                regex: /\b(?:last|strip|HBOUND|LBOUND|BAND|BLSHIFT|BNOT|BOR|BRSHIFT|BXOR|ANYALNUM|ANYALPHA|ANYCNTRL|ANYDIGIT|ANYFIRST|ANYGRAPH|ANYLOWER|ANYNAME|ANYPRINT|ANYPUNCT|ANYSPACE|ANYUPPER|ANYXDIGIT|BYTE|CALL CATS|CALL CATT|CALL CATX|CALL COMPCOST|CALL MISSING|CALL SCAN|CAT|CATQ|CATS|CATT|CATX|CHAR|CHOOSEC|CHOOSEN|COALESCEC|COLLATE|COMPARE|COMPBL|COMPGED|COMPLEV|COMPRESS|COUNT|COUNTC|COUNTW|DEQUOTE|FIND|FINDC|FINDW|FIRST|IFC|INDEX|INDEXC|INDEXW|LEFT|LENGTH|LENGTHC|LENGTHM|LENGTHN|LOWCASE|MD5|MISSING|MVALID|NLITERAL|NOTALNUM|NOTALPHA|NOTCNTRL|NOTDIGIT|NOTFIRST|NOTGRAPH|NOTLOWER|NOTNAME|NOTPRINT|NOTPUNCT|NOTSPACE|NOTUPPER|NOTXDIGIT|NVALID|PROPCASE|QUOTE|RANK|REPEAT|REVERSE|RIGHT|SCAN|SHA256 |SOUNDEX|SPEDIS|STRIP|SUBPAD|SUBSTR|SUBSTRN|TRANSLATE|TRANSTRN|TRANWRD|TRIM|TRIMN|TYPEOF|UPCASE|VERIFY|CALL PRXCHANGE|CALL PRXDEBUG|CALL PRXFREE|CALL PRXNEXT|CALL PRXPOSN|CALL PRXSUBSTR|PRXCHANGE|PRXMATCH|PRXPAREN|PRXPARSE|PRXPOSN|ALLCOMB|ALLPERM|CALL ALLCOMB|CALL ALLCOMBI|CALL ALLPERM|CALL GRAYCODE|CALL LEXCOMB|CALL LEXCOMBI|CALL LEXPERK|CALL LEXPERM|CALL RANCOMB|CALL RANPERK|CALL RANPERM|COMB|GRAYCODE|LCOMB|LEXCOMB|LEXCOMBI|LEXPERK|LEXPERM|LFACT|LPERM|PERM|CALL IS8601_CONVERT|DATDIF|DATE|DATEJUL|DATEPART|DATETIME|DAY|DHMS|HMS|HOLIDAY|HOUR|INTCINDEX|INTCK|INTCYCLE|INTFIT|INTFMT|INTGET|INTINDEX|INTNX|INTSEAS|INTSHIFT|INTTEST|JULDATE|JULDATE7|MDY|MINUTE|MONTH|NWKDOM|QTR|SECOND|TIME|TIMEPART|TODAY|TZONEID|TZONENAME|TZONEOFF|WEEK|WEEKDAY|YEAR|YRDIF|YYQ|CMISS|CSS|CV|EUCLID|GEOMEAN|GEOMEANZ|HARMEAN|HARMEANZ|IQR|KURTOSIS|LARGEST|LPNORM|MAD|MAX|MEAN|MEDIAN|MIN|MISSING|N|NMISS|ORDINAL|PCTL|RANGE|RMS|SKEWNESS|SMALLEST|STD|STDERR|SUM|SUMABS|USS|VAR|GEODIST|ZIPCITYDISTANCE|DCLOSE|DCREATE|DINFO|DNUM|DOPEN|DOPTNAME|DOPTNUM|DREAD|DROPNOTE|FAPPEND|FCLOSE|FCOL|FDELETE|FEXIST|FGET|FILEEXIST|FILENAME|FILEREF|FINFO|FNOTE|FOPEN|FOPTNAME|FOPTNUM|FPOINT|FPOS|FPUT|FREAD|FREWIND|FRLEN|FSEP|FWRITE|MOPEN|PATHNAME|RENAME|SYSMSG|SYSRC|CALL MODULE|MODULEC|MODULEN|BLACKCLPRC|BLACKPTPRC|BLKSHCLPRC|BLKSHPTPRC|COMPOUND|CONVX|CONVXP|CUMIPMT|CUMPRINC|DACCDB|DACCDBSL|DACCSL|DACCSYD|DACCTAB|DEPDB|DEPDBSL|DEPSL|DEPSYD|DEPTAB|DUR|DURP|EFFRATE|FINANCE|GARKHCLPRC|GARKHPTPRC|INTRR|IPMT|IRR|MARGRCLPRC|MARGRPTPRC|MORT|NETPV|NOMRATE|NPV|PMT|PPMT|PVP|SAVING|SAVINGS|TIMEVALUE|YIELDP|ARCOSH|ARSINH|ARTANH|COSH|SINH|TANH|CALL EXECUTE|CALL SYMPUT|CALL SYMPUTX|DOSUBL|RESOLVE|SYMEXIST|SYMGET|SYMGLOBL|SYMLOCAL|ABS|AIRY|BETA|CALL LOGISTIC|CALL SOFTMAX|CALL STDIZE|CALL TANH|CNONCT|COALESCE|COMPFUZZ|CONSTANT|DAIRY|DEVIANCE|DIGAMMA|ERF|ERFC|EXP|FACT|FNONCT|GAMMA|GCD|IBESSEL|JBESSEL|LCM|LGAMMA|LOG|LOG1PX|LOG10|LOG2|LOGBETA|LOGISTIC|MOD|MODZ|MSPLINT|SIGN|SQRT|TNONCT|TRIGAMMA|IFN|MODEXIST|CDF|LOGCDF|LOGPDF|LOGSDF|PDF|POISSON|PROBBETA|PROBBNML|PROBBNRM|PROBCHI|PROBF|PROBGAM|PROBHYPR|PROBMC|PROBNEGB|PROBNORM|PROBT|SDF|BETAINV|CINV|FINV|GAMINV|PROBIT|QUANTILE|SQUANTILE|TINV|CALL RANBIN|CALL RANCAU|CALL RANEXP|CALL RANGAM|CALL RANNOR|CALL RANPOI|CALL RANTBL|CALL RANTRI|CALL RANUNI|CALL STREAMINIT|NORMAL|RANBIN|RANCAU|RAND|RANEXP|RANGAM|RANNOR|RANPOI|RANTBL|RANTRI|RANUNI|UNIFORM|ATTRC|ATTRN|CEXIST|CLOSE|CUROBS|DROPNOTE|DSNAME|ENVLEN|EXIST|FCOPY|FETCH|FETCHOBS|GETVARC|GETVARN|IORCMSG|LIBNAME|LIBREF|NOTE|OPEN|PATHNAME|POINT|RENAME|REWIND|SYSEXIST|SYSMSG|SYSRC|VARFMT|VARINFMT|VARLABEL|VARLEN|VARNAME|VARNUM|VARTYPE|WHICHC|WHICHN|CALL SORTC|CALL SORTN|ADDRLONG|CALL POKE|CALL POKELONG|CALL SLEEP|CALL SYSTEM|DIF|GETOPTION|INPUT|INPUTC|INPUTN|LAG|PEEK|PEEKC|PEEKCLONG|PEEKLONG|PTRLONGADD|PUT|PUTC|PUTN|SLEEP|SYSEXIST|SYSGET|SYSPARM|SYSPROCESSID|SYSPROCESSNAME |SYSPROD|SYSTEM|UUIDGEN|FIPNAME|FIPNAMEL|FIPSTATE|STFIPS|STNAME|STNAMEL|ZIPCITY|ZIPCITYDISTANCE|ZIPFIPS|ZIPNAME|ZIPNAMEL|ZIPSTATE|ARCOS|ARSIN|ATAN|ATAN2|COS|COT|CSC|SEC|SIN|TAN|CEIL|CEILZ|FLOOR|FLOORZ|FUZZ|INT|INTZ|ROUND|ROUNDE|ROUNDZ|TRUNC|CALL LABEL|CALL SET|CALL VNAME|CALL VNEXT|VARRAY|VARRAYX|VFORMAT|VFORMATD|VFORMATDX|VFORMATN|VFORMATNX|VFORMATW|VFORMATWX|VFORMATX|VINARRAY|VINARRAYX|VINFORMAT|VINFORMATD|VINFORMATDX|VINFORMATN|VINFORMATNX|VINFORMATW|VINFORMATWX|VINFORMATX|VLABEL|VLABELX|VLENGTH|VLENGTHX|VNAME|VNAMEX|VTYPE|VTYPEX|VVALUE|VVALUEX|SOAPWEB|SOAPWEBMETA|SOAPWIPSERVICE|SOAPWIPSRS|SOAPWS|SOAPWSMETA|HTMLDECODE|HTMLENCODE|URLDECODE|URLENCODE)\b/,
                caseInsensitive: true
            }],
        "#dataset": [{
                token: [
                    "entity.name.library.sas",
                    "variable.variable.dataset.language.sas"
                ],
                regex: /\b((?:[A-z_]\w*\.)?)([A-z_]\w*)\b/
            }],
        "#check_balanced_bracket": [{
                token: "invalid.illegal",
                regex: /\)/
            }, {
                token: "text",
                regex: /\(/,
                push: [{
                        token: "text",
                        regex: /\)/,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        include: "#balanced_bracket"
                    }, {
                        include: "#dataOption"
                    }, {
                        include: "#funcList"
                    }]
            }],
        "#balanced_bracket": [{
                token: "text",
                regex: /\(/,
                push: [{
                        token: "text",
                        regex: /\)/,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        include: "#funcList"
                    }, {
                        include: "#balanced_bracket"
                    }, {
                        include: "#dataOption"
                    }]
            }],
        "#dataOption": [{
                token: "keyword.language.library.sas",
                regex: /\b(?:ALTER|BUFNO|BUFSIZE|CNTLLEV|COMPRESS|DLDMGACTION|ENCRYPT|ENCRYPTKEY|EXTENDOBSCOUNTER|GENMAX|GENNUM|INDEX|LABEL|OBSBUF|OUTREP|PW|PWREQ|READ|REPEMPTY|REPLACE|REUSE|ROLE|SORTEDBY|SPILL|TOBSNO|TYPE|WRITE|FILECLOSE|FIRSTOBS|IN|OBS|POINTOBS|WHERE|WHEREUP|IDXNAME|IDXWHERE|DROP|KEEP|RENAME)\b/,
                caseInsensitive: true
            }],
        "#controlStatement": [{
                token: "keyword.control.conditional.sas",
                regex: /\b(?:where|do|else|end|goto|if|to|until|while|leave|cancel|then)\b/,
                caseInsensitive: true
            }],
        "#controlKeyword": [{
                token: "keyword.control.general.sas",
                regex: /\b(?:ABORT|ARRAY|ATTRIB|BY|CARDS|CARDS4|CATNAME|CHECKPOINT EXECUTE_ALWAYS|CONTINUE|DATALINES|DATALINES4|DELETE|DESCRIBE|DISPLAY|DM|DROP|ENDSAS|ERROR|EXECUTE|FILE|FILENAME|FOOTNOTE|FORMAT|INFILE|INFORMAT|INPUT|KEEP|LABEL|LEAVE|LENGTH|LIBNAME|LINK|LIST|LOCK|LOSTCARD|OUTPUT|PUT|RENAME|REPLACE|RETAIN|RETURN|SELECT|STOP|X)\b/,
                caseInsensitive: true
            }],
        "#constant": [{
                token: "constant.numeric.sas",
                regex: /(?<![&\}])\b[0-9]*\.?[0-9]+(?:[eEdD][-+]?[0-9]+)?\b/
            }, {
                token: "constant.numeric.quote.single.sas",
                regex: /'[^']+'(?:dt|[dt])/
            }, {
                token: "constant.numeric.quote.double.sas",
                regex: /"[^"]+"(?:dt|[dt])/
            }],
        "#operator": [{
                token: "entity.name.arithmetic.sas",
                regex: /[\+\-\*\^\/]/
            }, {
                token: "keyword.operator.logical.sas",
                regex: /\s+(?:eq|ne|gt|lt|ge|le|in|not|&|\||and|or|min|max)\s+/,
                caseInsensitive: true
            }, {
                token: "keyword.operator.logical.sas",
                regex: /[\xAC<>^~]?=(?::)?|>|<|!/
            }],
        "#format": [{
                token: "support.format.sas",
                regex: /\b(?:\$)?[A-z]\w*\d*?\.\d*(?=[^\w])/
            }],
        "#double_quoted_string": [{
                token: "string.quoted.double.sas",
                regex: /"/,
                push: [{
                        token: "string.quoted.double.sas",
                        regex: /"/,
                        next: "pop"
                    }, {
                        include: "#macro"
                    }, {
                        defaultToken: "string.quoted.double.sas"
                    }]
            }],
        "#single_quoted_string": [{
                token: "string.quoted.single.sas",
                regex: /'/,
                push: [{
                        token: "string.quoted.single.sas",
                        regex: /'/,
                        next: "pop"
                    }, {
                        defaultToken: "string.quoted.single.sas"
                    }]
            }],
        "#block_comment_string": [{
                token: "punctuation.definition.comment",
                regex: /\/\*/,
                push: [{
                        token: "punctuation.definition.comment",
                        regex: /\*\//,
                        next: "pop"
                    }, {
                        token: "constant.character.escape.sas",
                        regex: /\\./
                    }, {
                        defaultToken: "comment.blcok.sas"
                    }]
            }],
        "#line_comment_string": [{
                token: "punctuation.definition.comment",
                regex: /^[\s%]*\*|(?<=;)[\s%]*\*/,
                push: [{
                        token: "comment.line.sas",
                        regex: /;/,
                        next: "pop"
                    }, {
                        token: "constant.character.escape.sas",
                        regex: /\\./
                    }, {
                        defaultToken: "comment.line.sas"
                    }]
            }],
        "#macrokeylist": [{
                token: "keyword.control.general.sas",
                regex: /%(?:put|global|do|else|end|goto|if|let|to|until|symdel|while|leave|cancel|scan|then|local|str|eval|len|sysfunc|compres|left|lowcase|qlowcase|qcmpres|qleft|qlowcase|qtrim|sysrc|trim|verify|bquote|nrbquote|index|length|nrstr|qscan|qsubstr|substr|qsubstr|superq|symexsit|symglobal|symlocal|sysget|upcase|qupcase)\b/,
                caseInsensitive: true
            }],
        "#macrovar": [{
                token: "support.class.character-class.sas",
                regex: /&+[a-z_](?:[a-z0-9_]+)?(?:\.+)?\b/,
                caseInsensitive: true
            }],
        "#macro": [{
                include: "#macrovar"
            }, {
                include: "#macrokeylist"
            }, {
                token: "support.class.character-class.sas",
                regex: /%[a-z_]\w*\s*\(/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\)/,
                        next: "pop"
                    }, {
                        include: "#double_quoted_string"
                    }, {
                        include: "#single_quoted_string"
                    }, {
                        token: ["variable.parameter.macro.sas", "text"],
                        regex: /([A-z_]\w*)(\s*=)/
                    }, {
                        include: "#macrovar"
                    }, {
                        include: "#macrokeylist"
                    }, {
                        token: "text",
                        regex: /\(/,
                        push: [{
                                token: "text",
                                regex: /\)/,
                                next: "pop"
                            }, {
                                include: "#double_quoted_string"
                            }, {
                                include: "#single_quoted_string"
                            }, {
                                include: "#balanced_bracket_macro"
                            }, {
                                include: "#macrovar"
                            }, {
                                include: "#macrokeylist"
                            }, {
                                token: "support.class.character-class.sas",
                                regex: /%[a-z_]\w*/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "support.class.character-class.sas",
                        regex: /%[a-z_]\w*/,
                        caseInsensitive: true
                    }]
            }, {
                token: "support.class.character-class.sas",
                regex: /%[a-z_]\w*/,
                caseInsensitive: true
            }],
        "#balanced_bracket_macro": [{
                token: "text",
                regex: /\(/,
                push: [{
                        token: "text",
                        regex: /\)/,
                        next: "pop"
                    }, {
                        include: "#double_quoted_string"
                    }, {
                        include: "#single_quoted_string"
                    }, {
                        include: "#balanced_bracket_macro"
                    }, {
                        include: "#macrokeylist"
                    }, {
                        include: "#macrovar"
                    }]
            }],
        "#style": [{
                token: "keyword.language.style.sas",
                regex: /\b(?:ASIS|BACKGROUNDCOLOR|BACKGOUNDIMAGE|BORDERBOTTOMCOLOR|BORDERBOTTOMSTYLE|BORDERBOTTOMWIDTH|BORDERLEFTCOLOR|BORDERLEFTSTYLE|BORDERLEFTWIDTH|BORDERCOLOR|BORDERCOLORDARK|BORDERCOLORLIGHT|BORDERRIGHTCOLOR|BORDERRIGHTSTYLE|BORDERRIGHTWIDTH|BORDERTOPCOLOR|BORDERTOPSTYLE|BORDERTOPWIDTH|BORDERWIDTH|CELLPADDING|CELLSPACING|CELLWIDTH|CLASS|COLOR|FLYOVER|FONT|FONTFAMILY|FONTSIZE|FONTSTYLE|FONTWEIGHT|FONTWIDTH|FRAME|HEIGHT|HREFTARGET|HTMLSTYLE|NOBREAKSPACE|OUTPUTWIDTH|POSTHTML|POSTIMAGE|POSTTEXT|PREHTML|PREIMAGE|PRETEXT|PROTECTSPECIALCHARS|RULES|TAGATTR|TEXTALIGN|URL|VERTICALALIGN|WIDTH)\b/,
                caseInsensitive: true
            }],
        "#styleAttribute": [{
                token: "keyword.language.style.sas",
                regex: /\b(?:COLOR|PATTERN|THICKNESS|TRANSPARENCY|SYMBOL|SIZE|WEIGHT|FAMILY)\b/,
                caseInsensitive: true
            }],
        "#sql": [{
                token: [
                    "storage.type.class.sas",
                    "storage.type.class.sas",
                    "storage.type.function.sas"
                ],
                regex: /\b(proc)( +)(sql)\b/,
                caseInsensitive: true,
                push: [{
                        token: "storage.type.class.sas",
                        regex: /\bquit\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: "keyword.other.sql",
                        regex: /\b(?:informat|num|insert|values|title\d*|create +table|separated +by|select|noprint|from|order +by|group +by|having|into|when|case|else|length|format|label|then|where|keep|drop|end|(?:left|right|inner) +join|union(?: +corr| +all)|except(?: +corr| +all))\b/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.operator.logical.sql",
                        regex: /\b(?:on|in|as|like|distinct|calculated|and|or)\b/,
                        caseInsensitive: true
                    }, {
                        token: "constant.language.sas",
                        regex: /\b[A-z0-9]+\./
                    }, {
                        include: "#format"
                    }, {
                        include: "#funcList"
                    }]
            }],
        "#procstep": [{
                token: "storage.type.class.sas",
                regex: /\bproc\b/,
                caseInsensitive: true,
                push: [{
                        token: "storage.type.class.sas",
                        regex: /\b(?:run|quit)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        include: "#procsteplist"
                    }]
            }],
        "#procsteplist": [{
                include: "#procsgrender"
            }, {
                include: "#procsgplot"
            }, {
                include: "#procttest"
            }, {
                include: "#procnpar1way"
            }, {
                include: "#procmixed"
            }, {
                include: "#procglm"
            }, {
                include: "#procfastclus"
            }, {
                include: "#proclifetest"
            }, {
                include: "#proccport"
            }, {
                include: "#procappend"
            }, {
                include: "#proclogistic"
            }, {
                include: "#procreg"
            }, {
                include: "#procsurveyselect"
            }, {
                include: "#procfactor"
            }, {
                include: "#proccluster"
            }, {
                include: "#procanova"
            }, {
                include: "#procunivariate"
            }, {
                include: "#proccorr"
            }, {
                include: "#procfreq"
            }, {
                include: "#procrank"
            }, {
                include: "#procprint"
            }, {
                include: "#procexport"
            }, {
                include: "#procdatasets"
            }, {
                include: "#proccontents"
            }, {
                include: "#proccatalog"
            }, {
                include: "#procreport"
            }, {
                include: "#procformat"
            }, {
                include: "#procprintto"
            }, {
                include: "#proccompare"
            }, {
                include: "#proctranspose"
            }, {
                include: "#procsort"
            }, {
                include: "#procmeans"
            }, {
                include: "#procgeneral"
            }],
        "#procgeneral": [{
                include: "#specialparser"
            }, {
                token: "storage.type.function.sas",
                regex: /\b(?:ACCESS|ACECLUS|ADAPTIVEREG|ALLELE|ANOM|ANOVA|APPEND|ARIMA|AUTHLIB|AUTOREG|BOM|BOXPLOT|BTL|CALENDAR|CALIS|CALLRFC|CANCORR|CANDISC|CAPABILITY|CASECONTROL|CATALOG|CATMOD|CHART|CIMPORT|CLP|CLUSTER|COMPARE|COMPUTAB|CONTENTS|CONVERT|COPY|CORR|CORRESP|COUNTREG|CPM|CPORT|CUSUM|DATASETS|DATASOURCE|DBF|DBLOAD|DEFINE_EVENT|DEFINE_TAGSET|DELETE|DIF|DISCRIM|DISPLAY|DISTANCE|DOCUMENT|DQMATCH|DQSCHEME|DQSRVADM|DQSRVSVC|DS2|DSTRANS|DTREE|ENTROPY|ESM|EXPAND|EXPLODE|EXPORT|FACTEX|FACTOR|FAMILY|FASTCLUS|FCMP|FEDSQL|FMM|FONTREG|FORECAST|FORMAT|FORMS|FREQ|FSBROWSE|FSEDIT|FSLETTER|FSLIST|FSVIEW|G3D|G3GRID|GA|GAM|GANNO|GANTT|GAREABAR|GBARLINE|GCHART|GCONTOUR|GDEVICE|GENESELECT|GENMOD|GEOCODE|GFONT|GIMPORT|GINSIDE|GKEYMAP|GKPI|GLIMMIX|GLM|GLMMOD|GLMPOWER|GLMSELECT|GMAP|GOPTIONS|GPLOT|GPROJECT|GRADAR|GREDUCE|GREMOVE|GREPLAY|GROOVY|GSLIDE|GTESTIT|GTILE|HADOOP|HAPLOTYPE|HP4SCORE|HPBIN|HPCLUS|HPCORR|HPCOUNTREG|HPDECIDE|HPDMDB|HPDS2|HPF|HPFARIMASPEC|HPFDIAGNOSE|HPFENGINE|HPFESMSPEC|HPFEVENTS|HPFEXMSPEC|HPFIDMSPEC|HPFOREST|HPFSELECT|HPFUCMSPEC|HPGENSELECT|HPIMPUTE|HPLMIXED|HPLOGISTIC|HPLSO|HPMIXED|HPNEURAL|HPNLIN|HPNLMOD|HPQLIM|HPREDUCE|HPREG|HPSAMPLE|HPSEVERITY|HPSPLIT|HPSUMMARY|HPTMINE|HPTMSCORE|HTSNP|HTTP|IML|IMPORT|IMSTAT|INBREED|INFOMAPS|INTPOINT|ISHIKAWA|JSON|KDE|KRIGE2D|LATTICE|LIFEREG|LIFETEST|LOAN|LOESS|LOGISTIC|LP|MACONTROL|MACRO|MAPIMPORT|MCMC|MDC|MDS|MEANS|METADATA|MI|MIANALYZE|MIGRATE|MIXED|MODECLUS|MODEL|MULTTEST|NESTED|NETDRAW|NETFLOW|NLIN|NLMIXED|NLP|NPAR1WAY|ODS|OLAP|OPERATE|OPTEX|OPTGRAPH|OPTIONS|OPTLOAD|OPTLP|OPTMILP|OPTMODEL|OPTQP|OPTSAVE|ORTHOREG|PANEL|PARETO|PDLREG|PHREG|PLAN|PLM|PLOT|PLS|PM|PMENU|POWER|PRESENV|PRINCOMP|PRINQUAL|PRINT|PRINTTO|PROBIT|PROTO|PRTDEF|PRTEXP|PSMOOTH|PWENCODE|QDEVICE|QLIM|QUANTLIFE|QUANTREG|QUANTSELECT|RANK|REG|REGISTRY|RELIABILITY|REPORT|ROBUSTREG|RSREG|SCAPROC|SCORE|SEQDESIGN|SEQTEST|SERVER|SEVERITY|SGDESIGN|SGPANEL|SGPLOT|SGRENDER|SGSCATTER|SHEWHART|SIM2D|SIMILARITY|SIMLIN|SIMNORMAL|SOAP|SORT|SPECTRA|SQL|STANDARD|STATESPACE|STATGRAPH|STDIZE|STDRATE|STEPDISC|STP|STREAM|SUMMARY|SURVEYFREQ|SURVEYLOGISTIC|SURVEYMEANS|SURVEYPHREG|SURVEYREG|SURVEYSELECT|SYSLIN|TABULATE|TCALIS|TEMPLATE|TIMEID|TIMEPLOT|TIMESERIES|TPSPLINE|TRANS|TRANSPOSE|TRANSREG|TRANTAB|TREE|TSCSREG|TTEST|UCM|UNIVARIATE|VARCLUS|VARCOMP|VARIOGRAM|VARMAX|X11|X12|XSL)\b/,
                caseInsensitive: true
            }],
        "#procsgrender": [{
                token: "storage.type.function.sas",
                regex: /\bsgrender\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.procsgrender.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA|DATTRMAP|SGANNO)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.procsgrender.sas",
                        regex: /\b(?:WHERE|format|pageby|sumby|TITLE\d*|FOOTNOTE\d*|DATTRVAR|DYNAMIC|OBJECT|OBJECTLABEL|SGE|TEMPLATE)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#procsgplot": [{
                token: "storage.type.function.sas",
                regex: /\bsgplot\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.procsgplot.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bSTYLEATTRS\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:DATACOLORS|DATACONTRASTCOLORS|DATALINEPATTERNS|DATASYMBOLS)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bBAND\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:lower|lower|ATTRID|DISCRETEOFFSET|FILL|NOFILL|FILLATTRS|LINEATTRS|NOEXTEND|OUTLINE|NOOUTLINE|TRANSPARENCY|TYPE|STEP|X|Y|TIP|NONE|TIPFORMAT|TIPLABEL|GROUP|NOMISSINGGROUP|CURVELABELATTRS|CURVELABELLOC|INSIDE|CURVELABELLOWER|CURVELABELPOS|MIN|MAX|START|END|CURVELABELUPPER|LEGENDLABEL|SPLITCHAR|SPLITCHARNODROP|SPLITJUSTIFY|CENTER|RIGHT|MODELNAME|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bBLOCK\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ALTFILLATTRS|ATTRID|FILL|NOFILL|FILLATTRS|FILLTYPE|ALTERNATE|LINEATTRS|OUTLINE|NOOUTLINE|TRANSPARENCY|X|POSITION|CENTER|TOP|BLOCKLABEL|NOVALUES|VALUES|SPLITCHAR|SPLITCHARNODROP|VALUEATTRS|VALUEFITPOLICY|SHRINK|SPLIT|SPLITALWAYS|TRUNCATE|VALUEHALIGN|CENTER|RIGHT|START|VALUEVALIGN|CENTER|BOTTOM|LABEL|NOLABEL|LABELATTRS|LABELPOS|LEFT|RIGHT|TOP|CLASS|EXTENDMISSING|NOMISSINGCLASS|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bBUBBLE\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|BRADIUSMAX|BRADIUSMIN|COLORMODEL|COLORRESPONSE|DATASKIN|FILL|NOFILL|FILLATTRS|LINEATTRS|TRANSPARENCY|X|Y|OUTLINE|NOOUTLINE|TIP|TIPFORMAT|TIPLABEL|GROUP|NOMISSINGGROUP|DATALABEL|DATALABELATTRS|DATALABELPOS|LEGENDLABEL|SPLITCHAR|SPLITCHARNODROP|SPLITJUSTIFY|URL|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bDENSITY\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|LINEATTRS|TRANSPARENCY|TYPE|SCALE|X|GROUP|CURVELABEL|CURVELABELATTRS|CURVELABELLOC|CURVELABELPOS|LEGENDLABEL|SPLITCHAR|SPLITCHARNODROP|SPLITJUSTIFY|FREQ|WEIGHT|Y|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bDOT\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|DATASKIN|DISCRETEOFFSET|TRANSPARENCY|TIP|TIPFORMAT|TIPLABEL|CLUSTERWIDTH|GROUP|GROUPDISPLAY|GROUPORDER|NOERRORCAPS|DATALABEL|DATALABELATTRS|DATALABELPOS|LEGENDLABEL|SPLITCHAR|SPLITCHARNODROP|SPLITJUSTIFY|STATLABEL|LIMITATTRS|LIMITS|LIMITSTAT|NUMSTD|FILLEDOUTLINEDMARKERS|MARKERATTRS|MARKERFILLATTRS|MARKEROUTLINEATTRS|ALPHA|CATEGORYORDER|FREQ|MISSING|RESPONSE|STAT|URL|WEIGHT|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bDROPLINE\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:DATASKIN|DISCRETEOFFSET|LINEATTRS|NOCLIP|TRANSPARENCY|DROPTO|X|Y|LABEL|LABELATTRS|LEGENDLABEL|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bELLIPSE\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:FILL|FILLATTRS|LEGENDLABEL|LINEATTRS|OUTLINE|TRANSPARENCY|X|Y|ALPHA|CLIP|FREQ|TYPE|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bFRINGE\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|LINEATTRS|TRANSPARENCY|X|TIP|TIPFORMAT|TIPLABEL|GROUP|HEIGHT|NOMISSINGGROUP|LEGENDLABEL|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bGRADLEGEND\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:BORDER|NOBORDER|NOTITLE|OUTERPAD|POSITION|TITLE|TITLEATTRS|EXTRACTSCALE)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bHBAR\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|BARWIDTH|BASELINEATTRS|DATASKIN|DISCRETEOFFSET|FILL|NOFILL|FILLATTRS|FILLTYPE|OUTLINE|NOOUTLINE|OUTLINEATTRS|TRANSPARENCY|BASELINE|X|Y|TIP|TIPFORMAT|TIPLABEL|CLUSTERWIDTH|GROUP|GROUPDISPLAY|GROUPORDER|DATALABEL|DATALABELATTRS|DATALABELFITPOLICY|DATALABELPOS|LEGENDLABEL|SEGLABEL|SEGLABELATTRS|SEGLABELFITPOLICY|SEGLABELFORMAT|STATLABEL|NOSTATLABEL|LIMITATTRS|LIMITS|LIMITSTAT|NUMSTD|ALPHA|CATEGORYORDER|FREQ|MISSING|RESPONSE|STAT|URL|WEIGHT|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bHBARPARM\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|BARWIDTH|BASELINEATTRS|DATASKIN|DISCRETEOFFSET|FILL|NOFILL|FILLATTRS|FILLTYPE|LEGENDLABEL|OUTLINE|NOOUTLINE|OUTLINEATTRS|TRANSPARENCY|BASELINE|X|Y|TIP|TIPFORMAT|TIPLABEL|CLUSTERWIDTH|GROUP|GROUPDISPLAY|GROUPORDER|DATALABEL|DATALABELATTRS|DATALABELFITPOLICY|DATALABELPOS|SEGLABEL|SEGLABELATTRS|SEGLABELFITPOLICY|SEGLABELFORMAT|LIMITATTRS|LIMITLOWER|LIMITUPPER|MISSING|URL|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bHBOX\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|BOXWIDTH|CAPSHAPE|CONNECT|CONNECTATTRS|DATASKIN|DISCRETEOFFSET|EXTREME|FILL|NOFILL|FILLATTRS|INTBOXWIDTH|LINEATTRS|MEANATTRS|MEDIANATTRS|NOCAPS|NOMEAN|NOMEDIAN|NOOUTLIERS|NOTCHES|OUTLIERATTRS|TRANSPARENCY|WHISKERATTRS|WHISKERPERCENTILE|X|Y|TIP|TIPFORMAT|TIPLABEL|CLUSTERWIDTH|GROUP|GROUPDISPLAY|GROUPORDER|DATALABEL|DATALABELATTRS|LABELFAR|LEGENDLABEL|SPLITCHAR|SPLITCHARNODROP|SPLITJUSTIFY|CATEGORY|FREQ|MISSING|PERCENTILE|SPREAD|WEIGHT|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bHIGHLOW\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|BARWIDTH|CLIPCAP|CLIPCAPSHAPE|DATASKIN|DISCRETEOFFSET|FILL|NOFILL|FILLATTRS|HIGHCAP|INTERVALBARWIDTH|LINEATTRS|LOWLABEL|OUTLINE|NOOUTLINE|TRANSPARENCY|X|Y|TIP|TIPFORMAT|TIPLABEL|CLUSTERWIDTH|GROUP|GROUPDISPLAY|GROUPORDER|NOMISSINGGROUP|HIGHLABEL|LABELATTRS|LEGENDLABEL|CLOSE|LOWCAP|OPEN|TYPE|URL|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bHISTOGRAM\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|DATASKIN|FILL|NOFILL|FILLATTRS|FILLTYPE|OUTLINE|TRANSPARENCY|X|Y|GROUP|DATALABEL|LEGENDLABEL|BINSTART|BINWIDTH|BOUNDARY|FREQ|NBINS|SCALE|SHOWBINS|WEIGHT|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bHLINE\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|BREAK|DATASKIN|DISCRETEOFFSET|LINEATTRS|TRANSPARENCY|X|Y|TIP|TIPFORMAT|TIPLABEL|CLUSTERWIDTH|GROUP|GROUPDISPLAY|GROUPORDER|NOERRORCAPS|CURVELABEL|CURVELABELATTRS|CURVELABELLOC|CURVELABELPOS|DATALABEL|DATALABELATTRS|DATALABELPOS|LEGENDLABEL|SPLITCHAR|SPLITCHARNODROP|SPLITJUSTIFY|STATLABEL|LIMITATTRS|LIMITS|LIMITSTAT|NUMSTD|FILLEDOUTLINEDMARKERS|MARKERATTRS|MARKERFILLATTRS|MARKEROUTLINEATTRS|MARKERS|ALPHA|CATEGORYORDER|FREQ|MISSING|RESPONSE|STAT|URL|WEIGHT|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bINSET\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:(?:NO)?BORDER|LABELALIGN|POSITION|TEXTATTRS|TITLE|TITLEATTRS|VALUEALIGN)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bKEYLEGEND\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ACROSS|AUTOITEMSIZE|BORDER|NOBORDER|DOWN|LINELENGTH|LOCATION|OPAQUE|NOOPAQUE|OPAQUE|OUTERPAD|POSITION|TITLE|TITLEATTRS|VALUEATTRS|SORTORDER|TYPE)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bLINEPARM\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|LINEATTRS|NOEXTEND|TRANSPARENCY|X|Y|GROUP|NOMISSINGGROUP|CURVELABEL|CURVELABELATTRS|CURVELABELLOC|CURVELABELPOS|LEGENDLABEL|SPLITCHAR|SPLITCHARNODROP|SPLITJUSTIFY|CLIP|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bLOESS\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|LINEATTRS|NOMARKERS|SMOOTH|TRANSPARENCY|X|Y|TIP|TIPFORMAT|TIPLABEL|GROUP|CURVELABEL|CURVELABELATTRS|CURVELABELLOC|CURVELABELPOS|DATALABEL|DATALABELATTRS|DATALABELPOS|LEGENDLABEL|SPLITCHAR|SPLITCHARNODROP|SPLITJUSTIFY|NOLEGCLM|NOLEGFIT|CLM|CLMATTRS|CLMTRANSPARENCY|FILLEDOUTLINEDMARKERS|JITTER|MARKERATTRS|MARKERFILLATTRS|MARKEROUTLINEATTRS|ALPHA|DEGREE|INTERPOLATION|MAXPOINTS|REWEIGHT|WEIGHT|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bNEEDLE\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|BASELINEATTRS|DATASKIN|DISCRETEOFFSET|LINEATTRS|TRANSPARENCY|BASELINE|X|Y|TIP|TIPFORMAT|TIPLABEL|CLUSTERWIDTH|GROUP|GROUPDISPLAY|GROUPORDER|NOMISSINGGROUP|DATALABEL|DATALABELATTRS|DATALABELPOS|LEGENDLABEL|SPLITCHAR|SPLITCHARNODROP|SPLITJUSTIFY|MARKERATTRS|MARKERS|URL|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bPBSPLINE\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|LINEATTRS|NKNOTS|SMOOTH|TRANSPARENCY|X|Y|TIP|TIPFORMAT|TIPLABEL|CURVELABEL|CURVELABELATTRS|CURVELABELLOC|CURVELABELPOS|DATALABEL|DATALABELATTRS|DATALABELPOS|SPLITCHAR|SPLITCHARNODROP|SPLITJUSTIFY|LEGENDLABEL|NOLEGCLI|NOLEGCLM|NOLEGFIT|CLI|CLIATTRS|CLM|CLMATTRS|CLMTRANSPARENCY|FILLEDOUTLINEDMARKERS|JITTER|MARKERATTRS|MARKERFILLATTRS|MARKEROUTLINEATTRS|NOMARKERS|PBSPLINE|MAXPOINTS|ALPHA|DEGREE|FREQ|GROUP|WEIGHT|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bPOLYGON\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|BACKLIGHT|COLORMODEL|COLORRESPONSE|DATASKIN|FILL|NOFILL|FILLATTRS|LINEATTRS|OUTLINE|NOOUTLINE|ROTATE|TRANSPARENCY|X|XOFFSET|Y|YOFFSET|TIP|TIPFORMAT|TIPLABEL|GROUP|NOMISSINGGROUP|LABEL|LABELATTRS|LABELLOC|LABELPOS|LEGENDLABEL|ROTATELABEL|SPLITCHAR|SPLITCHARNODROP|SPLITJUSTIFY|URL|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bREFLINE\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:DATASKIN|DISCRETEOFFSET|LINEATTRS|NOCLIP|TRANSPARENCY|AXIS|LABEL|LABELATTRS|LABELLOC|LABELPOS|LEGENDLABEL|SPLITCHAR|SPLITCHARNODROP|SPLITJUSTIFY|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bREG\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|LINEATTRS|TRANSPARENCY|X|Y|TIP|TIPFORMAT|TIPLABEL|GROUP|CURVELABEL|CURVELABELATTRS|CURVELABELLOC|CURVELABELPOS|DATALABEL|DATALABELATTRS|DATALABELPOS|SPLITCHAR|SPLITCHARNODROP|SPLITJUSTIFY|LEGENDLABEL|NOLEGCLI|NOLEGCLM|NOLEGFIT|CLI|CLIATTRS|CLM|CLMATTRS|CLMTRANSPARENCY|FILLEDOUTLINEDMARKERS|JITTER|MARKERATTRS|MARKERFILLATTRS|MARKEROUTLINEATTRS|NOMARKERS|ALPHA|DEGREE|FREQ|MAXPOINTS|WEIGHT|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bSCATTER\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|COLORMODEL|COLORRESPONSE|DATASKIN|DISCRETEOFFSET|ERRORBARATTRS|LABELSTRIP|TRANSPARENCY|X|Y|TIP|TIPFORMAT|TIPLABEL|CLUSTERWIDTH|GROUP|GROUPDISPLAY|GROUPORDER|NOERRORCAPS|NOMISSINGGROUP|DATALABEL|DATALABELATTRS|DATALABELPOS|LEGENDLABEL|SPLITCHAR|SPLITCHARNODROP|SPLITJUSTIFY|FILLEDOUTLINEDMARKERS|JITTER|JITTERWIDTH|MARKERATTRS|MARKERCHAR|MARKERCHARATTRS|MARKERFILLATTRS|MARKEROUTLINEATTRS|FREQ|URL|XERRORLOWER|XERRORUPPER|YERRORLOWER|YERRORUPPER|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bSERIES\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|DATASKIN|DISCRETEOFFSET|LINEATTRS|TRANSPARENCY|X|Y|TIP|TIPFORMAT|TIPLABEL|CLUSTERWIDTH|GROUP|GROUPDISPLAY|GROUPLC|GROUPLP|GROUPMC|GROUPMS|GROUPORDER|NOMISSINGGROUP|CURVELABEL|CURVELABELATTRS|CURVELABELLOC|CURVELABELPOS|DATALABEL|DATALABELATTRS|DATALABELPOS|LEGENDLABEL|SPLITCHAR|SPLITCHARNODROP|SPLITJUSTIFY|FILLEDOUTLINEDMARKERS|MARKERATTRS|MARKERFILLATTRS|MARKEROUTLINEATTRS|MARKERS|BREAK|URL|NAME|SMOOTHCONNECT)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bSTEP\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|DATASKIN|DISCRETEOFFSET|ERRORBARATTRS|JUSTIFY|LINEATTRS|TRANSPARENCY|X|Y|TIP|TIPFORMAT|TIPLABEL|CLUSTERWIDTH|GROUP|GROUPDISPLAY|GROUPORDER|NOERRORCAPS|NOMISSINGGROUP|CURVELABEL|CURVELABELATTRS|CURVELABELLOC|CURVELABELPOS|DATALABEL|DATALABELATTRS|DATALABELPOS|LEGENDLABEL|SPLITCHAR|SPLITCHARNODROP|SPLITJUSTIFY|FILLEDOUTLINEDMARKERS|MARKERATTRS|MARKERFILLATTRS|MARKEROUTLINEATTRS|MARKERS|URL|YERRORLOWER|YERRORUPPER|NAME|BREAK)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\b(?:SYMBOLCHAR|SYMBOLIMAGE)\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:HOFFSET|ROTATE|SCALE|TEXTATTRS|VOFFSET)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bTEXT\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|BACKFILL|BACKLIGHT|COLORMODEL|COLORRESPONSE|CONTRIBUTEOFFSETS|DISCRETEOFFSET|FILLATTRS|OUTLINE|OUTLINEATTRS|PAD|TRANSPARENCY|CLUSTERAXIS|X|Y|TIP|TIPFORMAT|TIPLABEL|CLUSTERWIDTH|GROUP|GROUPDISPLAY|NOMISSINGGROUP|LEGENDLABEL|URL|NAME|POSITION|ROTATE|SPLITCHAR|SPLITCHARNODROP|SPLITJUSTIFY|SPLITPOLICY|SPLITWIDTH|STRIP|TEXTATTRS|VCENTER)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bVBAR\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|BARWIDTH|BASELINEATTRS|DATASKIN|DISCRETEOFFSET|FILL|NOFILL|FILLATTRS|FILLTYPE|OUTLINE|NOOUTLINE|OUTLINEATTRS|TRANSPARENCY|BASELINE|X|Y|RESPONSE|TIP|TIPFORMAT|TIPLABEL|CLUSTERWIDTH|GROUP|GROUPDISPLAY|GROUPORDER|DATALABEL|DATALABELATTRS|DATALABELFITPOLICY|DATALABELPOS|LEGENDLABEL|SEGLABEL|SEGLABELATTRS|SEGLABELFITPOLICY|SEGLABELFORMAT|SPLITCHAR|SPLITCHARNODROP|STATLABEL|LIMITATTRS|LIMITS|LIMITSTAT|NUMSTD|ALPHA|CATEGORYORDER|FREQ|MISSING|STAT|URL|WEIGHT|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bVBARPARM\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|BARWIDTH|BASELINEATTRS|DATASKIN|DISCRETEOFFSET|FILL|NOFILL|FILLATTRS|FILLTYPE|OUTLINE|NOOUTLINE|OUTLINEATTRS|TRANSPARENCY|BASELINE|X|Y|TIP|TIPFORMAT|TIPLABEL|CLUSTERWIDTH|GROUP|GROUPDISPLAY|GROUPORDER|DATALABEL|DATALABELATTRS|DATALABELFITPOLICY|DATALABELPOS|LEGENDLABEL|SEGLABEL|SEGLABELATTRS|SEGLABELFITPOLICY|SEGLABELFORMAT|SPLITCHAR|SPLITCHARNODROP|LIMITATTRS|LIMITLOWER|LIMITUPPER|MISSING|URL|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bNEEDLE\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|BOXWIDTH|CAPSHAPE|CONNECT|CONNECTATTRS|DATASKIN|DISCRETEOFFSET|EXTREME|FILL|NOFILL|FILLATTRS|INTBOXWIDTH|LINEATTRS|MEANATTRS|MEDIANATTRS|NOCAPS|NOMEAN|NOMEDIAN|NOOUTLIERS|NOTCHES|OUTLIERATTRS|TRANSPARENCY|WHISKERATTRS|WHISKERPERCENTILE|X|Y|TIP|TIPFORMAT|TIPLABEL|CLUSTERWIDTH|GROUP|GROUPDISPLAY|GROUPORDER|DATALABEL|DATALABELATTRS|LABELFAR|LEGENDLABEL|SPLITCHAR|SPLITCHARNODROP|SPLITJUSTIFY|CATEGORY|FREQ|MISSING|PERCENTILE|SPREAD|WEIGHT|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bVECTOR\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ARROWDIRECTION|ARROWHEADSHAPE|ATTRID|DATASKIN|LINEATTRS|NOARROWHEADS|TRANSPARENCY|X|Y|TIP|TIPFORMAT|TIPLABEL|GROUP|NOMISSINGGROUP|DATALABEL|DATALABELATTRS|DATALABELPOS|LEGENDLABEL|SPLITCHAR|SPLITCHARNODROP|SPLITJUSTIFY|XORIGIN|YORIGIN|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bVLINE\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|BREAK|DATASKIN|DISCRETEOFFSET|LINEATTRS|TRANSPARENCY|X|Y|TIP|TIPFORMAT|TIPLABEL|CLUSTERWIDTH|GROUP|GROUPDISPLAY|GROUPORDER|NOERRORCAPS|CURVELABEL|CURVELABELATTRS|CURVELABELLOC|CURVELABELPOS|DATALABEL|DATALABELATTRS|DATALABELPOS|LEGENDLABEL|SPLITCHAR|SPLITCHARNODROP|SPLITJUSTIFY|STATLABEL|LIMITATTRS|LIMITS|LIMITSTAT|NUMSTD|FILLEDOUTLINEDMARKERS|MARKERATTRS|MARKERFILLATTRS|MARKEROUTLINEATTRS|MARKERS|ALPHA|CATEGORYORDER|FREQ|MISSING|RESPONSE|STAT|URL|WEIGHT|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bWATERFALL\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|BARWIDTH|BASELINEATTRS|COLORGROUP|DATASKIN|FILL|NOFILL|FILLATTRS|OUTLINE|TRANSPARENCY|X|Y|TIP|TIPFORMAT|TIPLABEL|FINALBARATTRS|FINALBARTICKVALUE|INITIALBARATTRS|INITIALBARTICKVALUE|INITIALBARVALUE|DATALABEL|DATALABELATTRS|SPLITCHAR|SPLITCHARNODROP|SPLITJUSTIFY|MISSING|STAT|URL|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bX2?AXIS\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:COLORBANDATTRS|COLORBANDS|DISPLAY|GRID|GRIDATTRS|MINORGRID|MINORGRIDATTRS|DISCRETEORDER|INTEGER|INTERVAL|LOGBASE|LOGSTYLE|LOGVTYPE|MAX|MIN|MINOR|MINORCOUNT|MINORINTERVAL|NOTIMESPLIT|OFFSETMAX|OFFSETMIN|RANGES|REFTICKS|REVERSE|THRESHOLDMAX|THRESHOLDMIN|TYPE|FITPOLICY|LABEL|LABELATTRS|LABELPOS|SPLITCHAR|SPLITCHARNODROP|SPLITJUSTIFY|VALUEATTRS|VALUES|VALUESDISPLAY|VALUESFORMAT|VALUESHINT)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bXAXISTABLE\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|COLORGROUP|DROPONMISSING|LOCATION|POSITION|SEPARATOR|TEXTGROUP|TEXTGROUPID|TITLE|TITLEATTRS|VALUEATTRS|X|LABEL|LABELATTRS|LABELPOS|STATLABEL|NOSTATLABEL|CLASSDISPLAY|CLASS|STAT|X|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bY2?AXIS\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:COLORBANDATTRS|COLORBANDS|DISPLAY|GRID|GRIDATTRS|MINORGRID|MINORGRIDATTRS|DISCRETEORDER|INTEGER|INTERVAL|LOGBASE|LOGSTYLE|LOGVTYPE|MAX|MIN|MINOR|MINORCOUNT|MINORINTERVAL|NOTIMESPLIT|OFFSETMAX|OFFSETMIN|RANGES|REFTICKS|REVERSE|THRESHOLDMAX|THRESHOLDMIN|TYPE|FITPOLICY|LABEL|LABELATTRS|LABELPOS|SPLITCHAR|SPLITCHARNODROP|SPLITJUSTIFY|VALUEATTRS|VALUES|VALUESDISPLAY|VALUESFORMAT|VALUESHINT)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\bYAXISTABLE\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#styleAttribute"
                            }, {
                                token: "keyword.language.procsgplot.sas",
                                regex: /\b(?:ATTRID|COLORGROUP|DROPONMISSING|LOCATION|POSITION|SEPARATOR|TEXTGROUP|TEXTGROUPID|TITLE|TITLEATTRS|VALUEATTRS|VALUEHALIGN|VALUEJUSTIFY|Y|LABEL|LABELATTRS|LABELHALIGN|LABELJUSTIFY|LABELPOS|STATLABEL|CLASSDISPLAY|CLASS|STAT|Y|NAME)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsgplot.sas",
                        regex: /\b(?:WHERE|format|pageby|sumby|TITLE\d*|FOOTNOTE\d*|ASPECT|CYCLEATTRS|DATA|DATTRMAP|DESCRIPTION|NOAUTOLEGEND|NOBORDER|NOSUBPIXEL|SUBPIXEL|NOWALL|PAD|PCTLEVEL|PCTNDEC|SGANNO|TMPLOUT|UNIFORM)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#procttest": [{
                token: "storage.type.function.sas",
                regex: /\bttest\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.procttest.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.procttest.sas",
                        regex: /\bBY\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procttest.sas",
                                regex: /\b(?:NOTSORTED|DESCENDING)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procttest.sas",
                        regex: /\b(?:WHERE|format|pageby|sumby|TITLE\d*|FOOTNOTE\d*|CLASS|FREQ|PAIRED|VAR|WEIGHT|CROSSOVER|IGNOREPERIOD|ORDER|ALPHA|DIST|H0|SIDES|TEST|TOST|CI|COCHRAN|PLOTS|BYVAR|NOBYVAR)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#procnpar1way": [{
                token: "storage.type.function.sas",
                regex: /\bnpar1way\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.procnpar1way.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.procnpar1way.sas",
                        regex: /\bBY\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procnpar1way.sas",
                                regex: /\b(?:NOTSORTED|DESCENDING)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procnpar1way.sas",
                        regex: /\bEXACT\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procnpar1way.sas",
                                regex: /\b(?:AB|CONOVER|HL|KLOTZ|KS|EDF|MEDIAN|MOOD|SAVAGE|SCORES|ST|VW|NORMAL|WILCOXON)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procnpar1way.sas",
                        regex: /\boutput\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: [
                                    "keyword.language.procnpar1way.output.sas",
                                    "text",
                                    "entity.name.library.output.sas",
                                    "variable.variable.dataset.language.sas"
                                ],
                                regex: /\b(out)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                                caseInsensitive: true
                            }, {
                                token: "keyword.language.procnpar1way.output.sas",
                                regex: /\b(?:AB|ANOVA|CONOVER|EDF|KS|FP|HL|KLOTZ|MEDIAN|MOOD|SAVAGE|SCORES|ST|VW|NORMAL|WILCOXON)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procnpar1way.sas",
                        regex: /\b(?:WHERE|format|pageby|sumby|TITLE\d*|FOOTNOTE\d*|CLASS|FREQ|MISSING|AB|ANOVA|CONOVER|D|DSCF|EDF|KS|FP|HL|KLOTZ|MEDIAN|MOOD|SAVAGE|SCORES|ST|VW|NORMAL|WILCOXON|ADJUST|ALPHA=|CORRECT|NOPRINT|PLOTS|VAR)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#procmixed": [{
                token: "storage.type.function.sas",
                regex: /\bmixed\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.procmixed.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.procmixed.sas",
                        regex: /\bBY\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procmixed.sas",
                                regex: /\b(?:NOTSORTED|DESCENDING)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procmixed.sas",
                        regex: /\bCLASS\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procmixed.sas",
                                regex: /\b(?:TRUNCATE|REF)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procmixed.sas",
                        regex: /\bCODE\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procmixed.sas",
                                regex: /\b(?:CATALOG|DUMMIES|ERROR|FILE|FORMAT|GROUP|IMPUTE|LINESIZE|LOOKUP|RESIDUAL)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procmixed.sas",
                        regex: /\b(?:CONTRAST|ESTIMATE)\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procmixed.sas",
                                regex: /\b(?:E|ETYPE|SINGULAR|DIVISOR|CHISQ|GROUP|GRP|DF|SUBJECT|SUB|LOWER|ALPHA|LOWERTAILED|UPPER|UPPERTAILED)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procmixed.sas",
                        regex: /\bRANDOM\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procmixed.sas",
                                regex: /\b(?:GDATA|GROUP|LDATA|NOFULLZ|RATIOS|SUBJECT|SUB|TYPE|ALPHA|CL|G|GC|GCI|GCORR|GI|SOLUTION|V|VC|VCI|VCORR|VI)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procmixed.sas",
                        regex: /\bLSMEANS\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procmixed.sas",
                                regex: /\b(?:AT|BYLEVEL|DIFF|OM|SINGULAR|SLICE|ADJDFE|ADJUST|ALPHA|DF|CL|CORR|COV|E)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procmixed.sas",
                        regex: /\bLSMESTIMATE\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procmixed.sas",
                                regex: /\b(?:AT|BYLEVEL|DIVISOR|OM|SINGULAR|ADJUST|ALPHA|LOWER|STEPDOWN|TESTVALUE|UPPER|CL|CORR|COV|E|ELSM|JOINT|SEED)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procmixed.sas",
                        regex: /\bMANOVA\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procmixed.sas",
                                regex: /\b(?:H|E|M|MNAMES|PREFIX|CANONICAL|ETYPE|HTYPE|MSTAT|ORTH|PRINTE|PRINTH|SUMMARY)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procmixed.sas",
                        regex: /\bREPEATED\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procmixed.sas",
                                regex: /\b(?:GROUP|LDATA|LOCAL|LOCALW|NONLOCALW|SUBJECT|TYPE|HLM|HLPS|R|RC|RCI|RCORR|RI)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procmixed.sas",
                        regex: /\bPARMS\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procmixed.sas",
                                regex: /\b(?:HOLD|LOGDETH|LOWERB|NOBOUND|NOITER|NOPRINT|NOPROFILE|OLS|PARMSDATA|RATIOS|UPPERB)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procmixed.sas",
                        regex: /\bPRIOR\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procmixed.sas",
                                regex: /\b(?:DATA|JEFFREYS|FLAT|ALG|BDATA|GRID|GRIDT|IFACTOR|LOGNOTE|LOGRBOUND|NSAMPLE|NSEARCH|OUT|OUTG|OUTGT|PSEARCH|PTRANS|SEED|SFACTOR|TDATA|TRANS|UPDATE)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procmixed.sas",
                        regex: /\bTEST\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procmixed.sas",
                                regex: /\b(?:ETYPE|HTYPE|E|H)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procmixed.sas",
                        regex: /\bMEANS\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procmixed.sas",
                                regex: /\b(?:DEPONLY|BON|DUNCAN|DUNNETT|DUNNETTL|DUNNETTU|GABRIEL|REGWQ|SCHEFFE|SIDAK|SMM|GT2|SNK|T|LSD|TUKEY|WALLER|ALPHA|CLDIFF|CLM|E|ETYPE|HTYPE|KRATIO|LINES|NOSORT|HOVTEST|WELCH)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procmixed.sas",
                        regex: /\bMODEL\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procmixed.model.sas",
                                regex: /\b(?:NOINT|ALPHA|ALPHAP|CHISQ|DDF|DDFM|HTYPE|INFLUENCE|NOTEST|OUTP|OUTPM|RESIDUAL|VCIRY|CL|CORRB|COVB|COVBI|E|E1|E2|E3|INTERCEPT|SOLUTION|SINGCHOL|SINGRES|SINGULAR|ZETA)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procmixed.sas",
                        regex: /\boutput\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: [
                                    "keyword.language.procmixed.output.sas",
                                    "text",
                                    "entity.name.library.output.sas",
                                    "variable.variable.dataset.language.sas"
                                ],
                                regex: /\b(out)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                                caseInsensitive: true
                            }, {
                                token: "keyword.language.procmixed.output.sas",
                                regex: /\b(?:COOKD|COVRATIO|DFFITS|H|LCL|LCLM|PREDICTED|PRESS|RESIDUAL|RSTUDENT|STDI|STDP|STDR|STUDENT|UCL|UCLM)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procmixed.sas",
                        regex: /\b(?:WHERE|format|pageby|sumby|TITLE\d*|FOOTNOTE\d*|ABSORB|ID|FREQ|STORE|SLICE|OUT|LABEL|WEIGHT|METHOD|NOPROFILE|ORDER|ASYCORR|ASYCOV|CL|COVTEST|IC|ITDETAILS|LOGNOTE|MMEQ|MMEQSOL|NOCLPRINT|NOITPRINT|PLOTS|RANKS|RATIO|MAXFUNC|MAXITER|CONVF|CONVG|CONVH|DFBW|EMPIRICAL|NOBOUND|RIDGE|SCORING)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#procglm": [{
                token: "storage.type.function.sas",
                regex: /\bglm\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.procglm.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA|OUTSTAT)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.procglm.sas",
                        regex: /\bBY\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procglm.sas",
                                regex: /\b(?:NOTSORTED|DESCENDING)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procglm.sas",
                        regex: /\bCLASS\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procglm.sas",
                                regex: /\b(?:TRUNCATE|REF)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procglm.sas",
                        regex: /\bCODE\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procglm.sas",
                                regex: /\b(?:CATALOG|DUMMIES|ERROR|FILE|FORMAT|GROUP|IMPUTE|LINESIZE|LOOKUP|RESIDUAL)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procglm.sas",
                        regex: /\b(?:CONTRAST|ESTIMATE)\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procglm.sas",
                                regex: /\b(?:E|ETYPE|SINGULAR|DIVISOR)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procglm.sas",
                        regex: /\bRANDOM\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procglm.sas",
                                regex: /\b(?:Q|TEST)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procglm.sas",
                        regex: /\bLSMEANS\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procglm.sas",
                                regex: /\b(?:ADJUST|ALPHA|AT|BYLEVEL|CL|COV|E|E|ETYPE|LINES|NOPRINT|OBSMARGINS|OUT|PDIFF|PLOT|SLICE|SINGULAR|STDERR|TDIFF)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procglm.sas",
                        regex: /\bMANOVA\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procglm.sas",
                                regex: /\b(?:H|E|M|MNAMES|PREFIX|CANONICAL|ETYPE|HTYPE|MSTAT|ORTH|PRINTE|PRINTH|SUMMARY)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procglm.sas",
                        regex: /\bREPEATED\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procglm.sas",
                                regex: /\b(?:CANONICAL|HTYPE|MEAN|MSTAT|NOM|NOU|PRINTE|PRINTH|PRINTM|PRINTRV|SUMMARY|UEPSDEF)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procglm.sas",
                        regex: /\bTEST\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procglm.sas",
                                regex: /\b(?:ETYPE|HTYPE|E|H)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procglm.sas",
                        regex: /\bMEANS\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procglm.sas",
                                regex: /\b(?:DEPONLY|BON|DUNCAN|DUNNETT|DUNNETTL|DUNNETTU|GABRIEL|REGWQ|SCHEFFE|SIDAK|SMM|GT2|SNK|T|LSD|TUKEY|WALLER|ALPHA|CLDIFF|CLM|E|ETYPE|HTYPE|KRATIO|LINES|NOSORT|HOVTEST|WELCH)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procglm.sas",
                        regex: /\bMODEL\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procglm.model.sas",
                                regex: /\b(?:EFFECTSIZE|INTERCEPT|NOINT|SOLUTION|TOLERANCE|NOUNI|E|E1|E2|E3|E4|ALIASING|SS1|SS2|SS3|SS4|ALPHA|CLI|CLM|CLPARM|P|INVERSE|XPX|SINGULAR|ZETA)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procglm.sas",
                        regex: /\boutput\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: [
                                    "keyword.language.procglm.output.sas",
                                    "text",
                                    "entity.name.library.output.sas",
                                    "variable.variable.dataset.language.sas"
                                ],
                                regex: /\b(out)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                                caseInsensitive: true
                            }, {
                                token: "keyword.language.procglm.output.sas",
                                regex: /\b(?:COOKD|COVRATIO|DFFITS|H|LCL|LCLM|PREDICTED|PRESS|RESIDUAL|RSTUDENT|STDI|STDP|STDR|STUDENT|UCL|UCLM)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procglm.sas",
                        regex: /\b(?:WHERE|format|pageby|sumby|TITLE\d*|FOOTNOTE\d*|ABSORB|ID|FREQ|STORE|ALPHA|DATA|MANOVA|MULTIPASS|NAMELEN|NOPRINT|ORDER|OUTSTAT|PLOTS)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#procfastclus": [{
                token: "storage.type.function.sas",
                regex: /\bfastclus\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.procfastclus.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA|SEED|INSTAT|OUT|OUTSTAT|MEAN|OUTSEED)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.procfastclus.sas",
                        regex: /\bBY\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procfastclus.sas",
                                regex: /\b(?:NOTSORTED|DESCENDING)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procfastclus.sas",
                        regex: /\b(?:WHERE|format|pageby|sumby|TITLE\d*|FOOTNOTE\d*|FREQ|ID|WEIGHT|VAR|VARDEF|CLUSTER|CLUSTERLABEL|OUT|OUTITER|OUTSEED or MEAN|OUTSTAT|DRIFT|MAXCLUSTERS|RADIUS|RANDOM|REPLACE|CONVERGE|DELETE|LEAST|MAXITER|STRICT|BINS|HC|HP|IRLS|IMPUTE|NOMISS|DISTANCE|LIST|NOPRINT|SHORT|SUMMARY|VARIABLESAREUNCORRELATED)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#proclifetest": [{
                token: "storage.type.function.sas",
                regex: /\blifetest\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.proclifetest.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA|OUTSURV|OUTTEST)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.proclifetest.sas",
                        regex: /\bBY\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.proclifetest.sas",
                                regex: /\b(?:NOTSORTED|DESCENDING)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proclifetest.sas",
                        regex: /\bSTRATA\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.proclifetest.sas",
                                regex: /\b(?:GROUP|NODETAIL|NOTEST|TEST|TREND|ADJUST|DIFF|MISSING|NOLABEL)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proclifetest.sas",
                        regex: /\b(?:WHERE|format|pageby|sumby|TITLE\d*|FOOTNOTE\d*|FREQ|ID|TEST|plots|TIME|WEIGHT|INTERVALS|NELSON|METHOD|NINTERVAL|WIDTH|ALPHA|BANDMAXTIME|BANDMINTIME|CONFBAND|CONFTYPE|ODS Graphics|MAXTIME|PLOTS|ATRISK|NOPRINT|NOTABLE|INTERVALS|NOLEFT|TIMELIST|REDUCEOUT|ALPHAQT|MISSING|SINGULAR|STDERR|TIMELIM)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#proccluster": [{
                token: "storage.type.function.sas",
                regex: /\bcluster\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.proccluster.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA|OUTTREE)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.proccluster.sas",
                        regex: /\bBY\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.proccluster.sas",
                                regex: /\b(?:NOTSORTED|DESCENDING)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proccluster.sas",
                        regex: /\b(?:WHERE|format|pageby|sumby|TITLE\d*|FOOTNOTE\d*|FREQ|ID|RMSSTD|VAR|COPY|BETA|HYBRID|METHOD|MODE|PENALTY|NOEIGEN|NONORM|NOSQUARE|STANDARD|TRIM|K|R|NOTIE|CCC|NOID|PRINT|PSEUDO|RMSSTD|RSQUARE|NOPRINT|PLOTS|SIMPLE)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#proclogistic": [{
                token: "storage.type.function.sas",
                regex: /\blogistic\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.proclogistic.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA|OUTDESIGN|OUTDESIGNONLY|OUTTEST|OUTMODEL|INMODEL|INEST)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.proclogistic.sas",
                        regex: /\bBY\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.proclogistic.sas",
                                regex: /\b(?:NOTSORTED|DESCENDING)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proclogistic.sas",
                        regex: /\bCLASS\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.proclogistic.sas",
                                regex: /\b(?:CPREFIX|DESCENDING|DESC|LPREFIX|MISSING|ORDER|PARAM|TRUNCATE|REF)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proclogistic.sas",
                        regex: /\bCODE\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.proclogistic.sas",
                                regex: /\b(?:CATALOG|DUMMIES|ERROR|FILE|FORMAT|GROUP|IMPUTE|LINESIZE|LOOKUP|RESIDUAL)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proclogistic.sas",
                        regex: /\bCONTRAST\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.proclogistic.sas",
                                regex: /\b(?:ALPHA|E|ESTIMATE|SINGULAR)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proclogistic.sas",
                        regex: /\bEFFECT\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.proclogistic.sas",
                                regex: /\b(?:DETAILS|DESIGNROLE|DETAILS|NLAG|PERIOD|WITHIN|NOEFFECT|WEIGHT|DEGREE|MDEGREE|STANDARDIZE|BASIS|DEGREE|KNOTMETHOD)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proclogistic.sas",
                        regex: /\bEFFECTPLOT\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.proclogistic.sas",
                                regex: /\b(?:BOX|CONTOUR|FIT|INTERACTION|MOSAIC|SLICEFIT)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proclogistic.sas",
                        regex: /\bESTIMATE\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.proclogistic.sas",
                                regex: /\b(?:DIVISOR|NOFILL|SINGULAR|ADJUST|ALPHA|LOWER|STEPDOWN|TESTVALUE|UPPER|CL|CORR|COV|E|JOINT|SEED|CATEGORY|EXP|ILINK)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proclogistic.sas",
                        regex: /\bEXACT\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.proclogistic.sas",
                                regex: /\b(?:ALPHA|CLTYPE|ESTIMATE|JOINT|JOINTONLY|MIDPFACTOR|ONESIDED|OUTDIST)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proclogistic.sas",
                        regex: /\bEXACTOPTIONS\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.proclogistic.sas",
                                regex: /\b(?:ABSFCONV|ADDTOBS|BUILDSUBSETS|EPSILON|FCONV|MAXTIME|METHOD|DIRECT|NETWORK|NETWORKMC|N|NOLOGSCALE|ONDISK|SEED|STATUSN|STATUSTIME|XCONV)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proclogistic.sas",
                        regex: /\bLSMEANS\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.proclogistic.sas",
                                regex: /\b(?:AT|BYLEVEL|DIFF|OM|SINGULAR|ADJUST|ALPHA|STEPDOWN|CL|CORR|COV|E|LINES|MEANS|PLOTS|SEED|EXP|ILINK|ODDSRATIO)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proclogistic.sas",
                        regex: /\bLSMESTIMATE\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.proclogistic.sas",
                                regex: /\b(?:AT|BYLEVEL|DIVISOR|OM|SINGULAR|ADJUST|ALPHA|LOWER|STEPDOWN|TESTVALUE|UPPER|CL|CORR|COV|E|ELSM|JOINT|SEED|CATEGORY|EXP|ILINK)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proclogistic.sas",
                        regex: /\bMODEL\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: [
                                    "keyword.language.proclogistic.model.sas",
                                    "text",
                                    "entity.name.library.model.sas",
                                    "variable.variable.dataset.language.sas"
                                ],
                                regex: /\b(OUTROC|OUTSTB|OUTVIF)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                                caseInsensitive: true
                            }, {
                                token: "keyword.language.proclogistic.model.sas",
                                regex: /\b(?:DESCENDING|ORDER|EVENT|REFERENCE|REF|EQUALSLOPES|LINK|NOFIT|NOINT|OFFSET|SELECTION|UNEQUALSLOPES|BEST|DETAILS|FAST|HIERARCHY|INCLUDE|MAXSTEP|SEQUENTIAL|SLENTRY|SLSTAY|START|STOP|STOPRES|ABSFCONV|FCONV|FIRTH|GCONV|MAXFUNCTION|MAXITER|NOCHECK|RIDGING|SINGULAR|TECHNIQUE|XCONV|ALPHA|CLODDS|CLPARM|PLCONV|CTABLE|PEVENT|PPROB|AGGREGATE|LACKFIT|SCALE|OUTROC|ROCEPS|INFLUENCE|IPLOTS|CORRB|COVB|EXPB|ITPRINT|NODUMMYPRINT|NOODDSRATIO|PARMLABEL|PCORR|RSQUARE|STB|BINWIDTH|NOLOGSCALE)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proclogistic.sas",
                        regex: /\bODDSRATIO\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.proclogistic.sas",
                                regex: /\b(?:AT|CL|DIFF|PLCONV|PLMAXITER|PLSINGULAR)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proclogistic.sas",
                        regex: /\boutput\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: [
                                    "keyword.language.proclogistic.output.sas",
                                    "text",
                                    "entity.name.library.output.sas",
                                    "variable.variable.dataset.language.sas"
                                ],
                                regex: /\b(out)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                                caseInsensitive: true
                            }, {
                                token: "keyword.language.proclogistic.output.sas",
                                regex: /\b(?:predprob|ALPHA|OUT|LOWER|PREDICTED|PREDPROBS|STDXBETA|UPPER|XBETA|C|CBAR|DFBETAS|DIFCHISQ|DIFDEV|H|RESCHI|RESDEV|RESLIK|STDRESCHI|STDRESDEV)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proclogistic.sas",
                        regex: /\bROC\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.proclogistic.sas",
                                regex: /\b(?:NOOFFSET|LINK)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proclogistic.sas",
                        regex: /\bROCCONTRAST\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.proclogistic.sas",
                                regex: /\b(?:REFERENCE|ADJACENTPAIRS|ESTIMATE|COV|E)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proclogistic.sas",
                        regex: /\b(?:SCORE|STORE)\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: [
                                    "keyword.language.proclogistic.output.sas",
                                    "text",
                                    "entity.name.library.output.sas",
                                    "variable.variable.dataset.language.sas"
                                ],
                                regex: /\b(DATA|OUT|OUTROC|PRIOR)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                                caseInsensitive: true
                            }, {
                                token: "keyword.language.proclogistic.output.sas",
                                regex: /\b(?:ALPHA|CUMULATIVE|CLM|FITSTAT|PRIOREVENT|ROCEPS)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proclogistic.sas",
                        regex: /\bSTRATA\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.proclogistic.sas",
                                regex: /\b(?:CHECKDEPENDENCY|MISSING|NOSUMMARY|INFO)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proclogistic.sas",
                        regex: /\b(?:WHERE|format|pageby|sumby|TITLE\d*|FOOTNOTE\d*|FREQ|ID|WEIGHT|NORM|NORMALIZE|UNITS|DEFAULT|STROE|SLICE|NLOPTIONS|COVOUT|DATA|INEST|INMODEL|NOCOV|OUTDESIGN|OUTDESIGNONLY|OUTEST|OUTMODEL|DESCENDING|NAMELEN|ORDER|TRUNCATE|ALPHA|NOPRINT|PLOTS|SIMPLE|MULTIPASS|EXACTONLY|EXACTOPTIONS|ROCOPTIONS)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#procreg": [{
                token: "storage.type.function.sas",
                regex: /\breg\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.procreg.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA|OUTSSCP|OUTEST)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.procreg.sas",
                        regex: /\bBY\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procreg.sas",
                                regex: /\b(?:NOTSORTED|DESCENDING)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procreg.sas",
                        regex: /\bCODE\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procreg.sas",
                                regex: /\b(?:CATALOG|DUMMIES|ERROR|FILE|FORMAT|GROUP|IMPUTE|LINESIZE|LOOKUP|RESIDUAL)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procreg.sas",
                        regex: /\bMODEL\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: [
                                    "keyword.language.procreg.model.sas",
                                    "text",
                                    "entity.name.library.model.sas",
                                    "variable.variable.dataset.language.sas"
                                ],
                                regex: /\b(OUTSEB|OUTSTB|OUTVIF)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                                caseInsensitive: true
                            }, {
                                token: "keyword.language.procreg.model.sas",
                                regex: /\b(?:SELECTION|BEST|DETAILS|DETAILS|GROUPNAMES|INCLUDE|MAXSTEP|NOINT|PCOMIT|RIDGE|SLE|SLS|START|STOP|ADJRSQ|AIC|B|BIC|CP|GMSEP|JP|MSE|PC|RMSE|SBC|SP|SSE|EDF|OUTSEB|OUTSTB|OUTVIF|PRESS|RSQUARE|I|XPX|ACOV|ACOVMETHOD|COLLIN|COLLINOINT|CORRB|COVB|HCC|HCCMETHOD|LACKFIT|PARTIALR2|PCORR1|PCORR2|SCORR1|SCORR2|SEQB|SPEC|SRT|SS1|SS2|STB|TOL|WHITE|VIF|CLB|CLI|CLM|DW|DWPROB|INFLUENCE|P|PARTIAL|PARTIALDATA|R|ALL|ACOV|CLB|CLI|CLM|CORRB|COVB|HCC|I|P|PCORR1|PCORR2|R|SCORR1|SCORR2|SEQB|SPEC|SS1|SS2|STB|TOL|VIF|XPX|ALPHA|NOPRINT|SIGMA|SINGULAR)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procreg.sas",
                        regex: /\boutput\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: [
                                    "keyword.language.procreg.output.sas",
                                    "text",
                                    "entity.name.library.output.sas",
                                    "variable.variable.dataset.language.sas"
                                ],
                                regex: /\b(out)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                                caseInsensitive: true
                            }, {
                                token: "keyword.language.procreg.output.sas",
                                regex: /\b(?:COOKD|COVRATIO|DFFITS|H|LCL|LCLM|PREDICTED|PRESS|RESIDUAL|RSTUDENT|STDI|STDP|STDR|STUDENT|UCL|UCLM)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procreg.sas",
                        regex: /\b(?:WHERE|format|pageby|sumby|TITLE\d*|FOOTNOTE\d*|COVOUT|EDF|OUTSEB|OUTSTB|OUTVIF|PCOMIT|PRESS|RIDGE|RSQUARE|TABLEOUT|PLOTS|CORR|SIMPLE|USSCP|ALL|NOPRINT|ALPHA|SINGULAR|FREQ|ID|VAR|WEIGHT|ADD|DELETE|PAINT|PLOT|PRINT|ANOVA|MODELDATA|REFIT|RESTRICT|REWEIGHT|STOR|TEST)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#procsurveyselect": [{
                token: "storage.type.function.sas",
                regex: /\bSURVEYSELECT\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.procsurveyselect.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA|OUT|OUTSORT)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.procsurveyselect.sas",
                        regex: /\bBY\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procsurveyselect.sas",
                                regex: /\b(?:NOTSORTED|DESCENDING)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsurveyselect.sas",
                        regex: /\bSTRATA\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procsurveyselect.sas",
                                regex: /\b(?:ALLOC|ALLOCMIN|ALPHA|COST|MARGIN|NOSAMPLE|STATS|VAR)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsurveyselect.sas",
                        regex: /\b(?:WHERE|format|pageby|sumby|TITLE\d*|FOOTNOTE\d*|FREQ|ID|SIZE|STRATA|CONTROL|PPS|PRESORTED|METHOD|SAMPSIZE|SELECTALL|SAMPRATE|NMIN|NMAX|REPS|MINSIZE|MAXSIZE|CERTSIZE|CERTSIZE|P|SORT|SEED|RANUNI|GROUPS|NOPRINT|CERTUNITS|JTPROBS|OUTALL|OUTHITS|OUTSEED|OUTSIZE|STATS)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#procfactor": [{
                token: "storage.type.function.sas",
                regex: /\bfactor\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.procfactor.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA|OUT|TARGET|OUTSTAT)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.procfactor.sas",
                        regex: /\bBY\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procfactor.sas",
                                regex: /\b(?:NOTSORTED|DESCENDING)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procfactor.sas",
                        regex: /\bPATHDIAGRAM\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procfactor.sas",
                                regex: /\b(?:ALPHA|ARRANGE|COVER|FACTORSIZE|FUZZ|DECP|NOESTIM|NOERRVAR|NOFACTORVAR|NOVARIANCE|DIAGRAMLABEL|LABEL|NODELABEL|NOTITLE|TITLE)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procfactor.sas",
                        regex: /\b(?:WHERE|format|pageby|sumby|TITLE\d*|FOOTNOTE\d*|FREQ|ID|PARTIAL|WEIGHT|PRIORS|PATHDIAGRAM|HEYWOOD|METHOD|PRIORS|RANDOM|ULTRAHEYWOOD|MINEIGEN|NFACTORS|PROPORTION|ALPHA|COVARIANCE|COVER|NOINT|SE|VARDEF|WEIGHT|GAMMA|HKPOWER|NORM|NOPROMAXNORM|POWER|PREROTATE|RCONVERGE|RITER|ROTATE|TAU|ODS Graphics|PLOTS|ALL|CORR|EIGENVECTORS|FLAG|FUZZ|MSA|NOPRINT|NPLOT|PLOT|PLOTREF|PREPLOT|PRINT|REORDER|RESIDUALS|ROUND|SCORE|SCREE|SIMPLE|CONVERGE|MAXITER|SINGULAR|NOCORR|NOBS|PARPREFIX|PREFIX)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#proccport": [{
                token: "storage.type.function.sas",
                regex: /\bcport\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.proccport.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA|BASE)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.proccport.sas",
                        regex: /\b(?:WHERE|format|pageby|sumby|TITLE\d*|EXCLUDE|SELECT|TRANTAB)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#procappend": [{
                token: "storage.type.function.sas",
                regex: /\bappend\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.procappend.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA|BASE)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.procappend.sas",
                        regex: /\b(?:WHERE|format|pageby|sumby|TITLE\d*|APPENDVER|ENCRYPTKEY|FORCE|GETSORT|NOWARN)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#procanova": [{
                token: "storage.type.function.sas",
                regex: /\banova\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.procanova.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA|OUTSTAT)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.procanova.sas",
                        regex: /\bBY\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procanova.sas",
                                regex: /\b(?:NOTSORTED|DESCENDING)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procanova.class.sas",
                        regex: /\bCLASS\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procanova.class.sas",
                                regex: /\b(?:REF|TRUNCATE)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procanova.model.sas",
                        regex: /\bMODEL\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procanova.model.sas",
                                regex: /\b(?:INTERCEPT|INT|NOUNI)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procanova.manova.sas",
                        regex: /\bMANOVA\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procanova.manova.sas",
                                regex: /\b(?:H|E|M|MNAMES|PREFIX|CANONICAL|MSTAT|ORTH|PRINTE|PRINTH|SUMMARY)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procanova.means.sas",
                        regex: /\bMEANS\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procanova.means.sas",
                                regex: /\b(?:BON|DUNCAN|DUNNETT|DUNNETTL|DUNNETTU|GABRIEL|REGWQ|SCHEFFE|SIDAK|SMM|SNK|T|TUKEY| WALLER|ALPHA|CLDIFF|CLM|E|KRATIO|LINES|NOSORT|HOVTEST|WELCH)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procanova.repeated.sas",
                        regex: /\bREPEATED\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procanova.repeated.sas",
                                regex: /\b(?:CANONICAL|MSTAT|NOM|NOU|PRINTE|PRINTH|PRINTM|PRINTRV|SUMMARY|UEPSDEF)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procanova.test.sas",
                        regex: /\bTEST\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procanova.test.sas",
                                regex: /\b(?:H|E)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procanova.sas",
                        regex: /\b(?:WHERE|format|pageby|sumby|TITLE\d*|FOOTNOTE\d*|ABSORB|FREQ|DATA|MANOVA|MULTIPASS|NAMELEN|NOPRINT|ORDER|OUTSTAT|PLOTS)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#procunivariate": [{
                token: "storage.type.function.sas",
                regex: /\bunivariate\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.procunivariate.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.procunivariate.sas",
                        regex: /\bBY\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procunivariate.sas",
                                regex: /\b(?:NOTSORTED|DESCENDING)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procunivariate.cdfplot.sas",
                        regex: /\bCDFPLOT\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procunivariate.cdfplot.sas",
                                regex: /\b(?:BETA|EXPONENTIAL|GAMMA|GUMBEL|IGAUSS|LOGNORMAL|NORMAL|PARETO|POWER|RAYLEIGH|WEIBULL|COLOR|L|W|ALPHA|BETA|SIGMA|THETA|SIGMA|THETA|ALPHA|ALPHADELTA|ALPHAINITIAL|MAXITER|SIGMA|THETA|MU|SIGMA|LAMBDA|MU|SIGMA|THETA|ZETA|MU|SIGMA|ALPHA|SIGMA|THETA|ALPHA|SIGMA|THETA|SIGMA|THETA|C|ITPRINT|MAXITER|SIGMA|THETA|HREF|HREFLABELS|HREFLABPOS|NOECDF|NOHLABEL|NOVLABEL|NOVTICK|STATREF|STATREFLABELS|STATREFSUBCHAR|VAXISLABEL|VREF|VREFLABELS|VREFLABPOS|VSCALE|ANNOTATE|CAXIS|CFRAME|CHREF|CSTATREF|CTEXT|CVREF|DESCRIPTION|FONT|HAXIS|HEIGHT|HMINOR|INFONT|INHEIGHT|LHREF|LSTATREF|LVREF|NAME|NOFRAME|TURNVLABELS|VAXIS|VMINOR|WAXIS|ODSFOOTNOTE|ODSFOOTNOTE|ODSTITLE|ODSTITLE|OVERLAY|ANNOKEY|CFRAMESIDE|CFRAMETOP|CPROP|CTEXTSIDE|CTEXTTOP|INTERTILE|NCOLS|NROWS|CONTENTS)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procunivariate.sas",
                        regex: /\boutput\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: [
                                    "keyword.language.procunivariate.output.sas",
                                    "text",
                                    "entity.name.library.output.sas",
                                    "variable.variable.dataset.language.sas"
                                ],
                                regex: /\b(out)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                                caseInsensitive: true
                            }, {
                                token: "keyword.language.procunivariate.output.sas",
                                regex: /\b(?:CSS|CV|GEOMEAN|KURTOSIS|KURT|MAX|MEAN|MIN|MODE|N|NMISS|NOBS|RANGE|SKEWNESS|SKEW|STD|STDDEV|STDMEAN|STDERR|SUM|SUMWGT|USS|VAR|P1|P5|P10|Q1|P25|MEDIAN|Q2|P50|Q3|P75|P90|P95|P99|QRANGE|GINI|MAD|QN|SN|STD_GINI|STD_MAD|STD_QN|STD_QRANGE|STD_SN|MSIGN|NORMALTEST|SIGNRANK|PROBM|PROBN|PROBS|PROBT|T|CIPCTLDF|CIQUANTDF|ALPHA|LOWERPRE|LOWERNAME|TYPE|UPPERPRE|UPPERNAME|ALPHA|LOWERPRE|LOWERNAME|TYPE|UPPERPRE|UPPERNAME|PCTLNAME|PCTLNDEC|PCTLPRE|PCTLPTS)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procunivariate.class.sas",
                        regex: /\bCLASS\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procunivariate.class.sas",
                                regex: /\b(?:MISSING|ORDER|KEYLEVEL|NOKEYMOVE)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procunivariate.HISTOGRAM.sas",
                        regex: /\bHISTOGRAM\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                token: "keyword.language.procunivariate.HISTOGRAM.sas",
                                regex: /\b(?:COLOR|hreflabel|CONTENTS|TO|BY|FILL|L|MIDPERCENTS|NOPRINT|PERCENTS|W|ALPHA|BETA|SIGMA|THETA|SIGMA|THETA|ALPHA|ALPHADELTA|ALPHAINITIAL|MAXITER|SIGMA|THETA|EDFNSAMPLES|EDFSEED|MU|SIGMA|EDFNSAMPLES|EDFSEED|LAMBDA|MU|SIGMA|THETA|ZETA|MU|SIGMA|EDFNSAMPLES|EDFSEED|ALPHA|SIGMA|THETA|ALPHA|SIGMA|THETA|EDFNSAMPLES|EDFSEED|SIGMA|THETA|DELTA|FITINTERVAL|FITMETHOD|FITTOLERANCE|GAMMA|SIGMA|THETA|DELTA|FITINTERVAL|FITMETHOD|FITTOLERANCE|GAMMA|OPTBOUNDRANGE|OPTMAXITER|OPTMAXSTARTS|OPTPRINT|OPTSEED|OPTTOLERANCE|SIGMA|THETA|C|ITPRINT|MAXITER|SIGMA|THETA|BARLABEL|CLIPCURVES|ENDPOINTS|GRID|HANGING|HREF|HREFLABELS|HREFLABPOS|MIDPOINTS|NENDPOINTS|NMIDPOINTS|NOBARS|NOHLABEL|NOPLOT|NOVLABEL|NOVTICK|RTINCLUDE|STATREF|STATREFLABELS|STATREFSUBCHAR|VAXISLABEL|VREF|VREFLABELS|VREFLABPOS|VSCALE|ANNOTATE|BARWIDTH|CAXIS|CBARLINE|CFILL|CFRAME|CGRID|CHREF|CLIPREF|CSTATREF|CTEXT|CVREF|DESCRIPTION|FONT|FRONTREF|HAXIS|HEIGHT|HMINOR|HOFFSET|INFONT|INHEIGHT|INTERBAR|LGRID|LHREF|LSTATREF|LVREF|NAME|NOFRAME|PFILL|TURNVLABELS|VAXIS|VMINOR|VOFFSET|WAXIS|WBARLINE|WGRID|ODSFOOTNOTE|ODSFOOTNOTE2|ODSTITLE|ODSTITLE2|OVERLAY|ANNOKEY|CFRAMESIDE|CFRAMETOP|CPROP|CTEXTSIDE|CTEXTTOP|INTERTILE|MAXNBIN|MAXSIGMAS|NCOLS|NROWS|CONTENTS|MIDPERCENTS|NOTABCONTENTS|OUTHISTOGRAM|OUTKERNEL|BETA|EXPONENTIAL|GAMMA|GUMBEL|IGAUSS|LOGNORMAL|NORMAL|PARETO|POWER|RAYLEIGH|SB|SU|WEIBULL)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procunivariate.inset.sas",
                        regex: /\bINSET\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                token: "keyword.language.procunivariate.inset.sas",
                                regex: /\b(?:CSS|CV|POS|hreflabel|GEOMEAN|KURTOSIS|KURT|MAX|MEAN|MIN|MODE|N|NEXCL|NMISS|NOBS|RANGE|SKEWNESS|SKEW|STD|STDDEV|STDMEAN|STDERR|SUM|SUMWGT|USS|VAR|P1|P5|P10|Q1|P25|MEDIAN|Q2|P50|Q3|P75|P90|P95|P99|QRANGE|P1_LCL_DF|P1_UCL_DF|P5_LCL_DF|P5_UCL_DF|P10_LCL_DF|P10_UCL_DF|Q1_LCL_DF|P25_LCL_DF|Q1_UCL_DF|P25_UCL_DF|MEDIAN_LCL_DF|Q2_LCL_DF|P50_LCL_DF|MEDIAN_UCL_DF|Q2_UCL_DF|P50_UCL_DF|Q3_LCL_DF|P75_LCL_DF|Q3_UCL_DF|P75_UCL_DF|P90_LCL_DF|P90_UCL_DF|P95_LCL_DF|P95_UCL_DF|P99_LCL_DF|P99_UCL_DF|P1_LCL|P1_UCL|P5_LCL|P5_UCL|P10_LCL|P10_UCL|Q1_LCL|P25_LCL|Q1_UCL|P25_UCL|MEDIAN_LCL|Q2_LCL|P50_LCL|MEDIAN_UCL|Q2_UCL|P50_UCL|Q3_LCL|P75_LCL|Q3_UCL|P75_UCL|P90_LCL|P90_UCL|P95_LCL|P95_UCL|P99_LCL|P99_UCL|GINI|MAD|QN|SN|STD_GINI|STD_MAD|STD_QN|STD_QRANGE|STD_SN|MSIGN|NORMALTEST|PNORMAL|SIGNRANK|PROBM|PROBN|PROBS|PROBT|T|BETA|EXPONENTIAL|GAMMA|GUMBEL|IGAUSS|CDFPLOT|HISTOGRAM|PPPLOT|KERNEL|HISTOGRAM|LOGNORMAL|NORMAL|PARETO|POWER|RAYLEIGH|SB|HISTOGRAM|SU|HISTOGRAM|WEIBULL|WEIBULL2|PROBPLOT|QQPLOT|ALPHA|SHAPE1|BETA|SHAPE2|MEAN|SIGMA|SCALE|STD|THETA|THRESHOLD|MEAN|SIGMA|SCALE|STD|THETA|THRESHOLD|ALPHA|SHAPE|MEAN|SIGMA|SCALE|STD|THETA|THRESHOLD|MEAN|MU|SIGMA|SCALE|STD|LAMBDA|MEAN|MU|STD|AMISE|BANDWIDTH|BWIDTH|C|TYPE|MEAN|SIGMA|SHAPE|STD|THETA|THRESHOLD|ZETA|SCALE|MU|MEAN|SIGMA|STD|ALPHA|MEAN|SIGMA|SCALE|STD|THETA|THRESHOLD|ALPHA|MEAN|SIGMA|SCALE|STD|THETA|THRESHOLD|MEAN|SIGMA|SCALE|STD|THETA|THRESHOLD|DELTA|SHAPE1|GAMMA|SHAPE2|MEAN|SIGMA|SCALE|STD|THETA|THRESHOLD|C|SHAPE|MEAN|SIGMA|SCALE|STD|THETA|THRESHOLD|C|SHAPE|MEAN|SIGMA|SCALE|STD|THETA|THRESHOLD|AD|ADPVAL|CVM|CVMPVAL|KSD|KSDPVAL|CFILL|CFILLH|CFRAME|CHEADER|CSHADOW|CTEXT|FONT|FORMAT|GUTTER|HEADER|HEIGHT|NCOLS|NOFRAME|POSITION|REFPOINT)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procunivariate.inset.sas",
                        regex: /\b(?:PPPLOT|PROBPLOT|QQPLOT)\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procunivariate.inset.sas",
                                regex: /\b(?:BETA|EXPONENTIAL|GAMMA|GUMBEL|PARETO|IGAUSS|LOGNORMAL|NORMAL|POWER|RAYLEIGH|WEIBULL|COLOR|L|NOLINE|W|ALPHA|BETA|SIGMA|THETA|SIGMA|THETA|ALPHA|ALPHADELTA|ALPHAINITIAL|MAXITER|SIGMA|THETA|MU|SIGMA|LAMBDA|MU|SIGMA|THETA|ZETA|MU|SIGMA|ALPHA|SIGMA|THETA|ALPHA|SIGMA|THETA|SIGMA|THETA|C|ITPRINT|MAXITER|SIGMA|THETA|HREF|HREFLABELS|HREFLABPOS|NOHLABEL|NOVLABEL|NOVTICK|SQUARE|VAXISLABEL|VREF|VREFLABELS|VREFLABPOS|ANNOTATE|CAXIS|CFRAME|CHREF|CTEXT|CVREF|DESCRIPTION|FONT|HAXIS|HEIGHT|HMINOR|INFONT|INHEIGHT|LHREF|LVREF|NAME|NOFRAME|TURNVLABELS|VAXIS|VMINOR|WAXIS|ODSFOOTNOTE|ODSFOOTNOTE2|ODSTITLE|ODSTITLE2|OVERLAY|ANNOKEY|CFRAMESIDE|CFRAMETOP|CPROP|CTEXTSIDE|CTEXTTOP|INTERTILE|NCOLS|NROWS|CONTENTS)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procunivariate.sas",
                        regex: /\b(?:WHERE|format|pageby|sumby|TITLE\d*|FOOTNOTE\d*|ALL|FREQ|VAR|WEIGHT|ID|ALPHA|ANNOTATE|ANNO|CIBASIC|TYPE|ALPHA|CIPCTLDF|CIQUANTDF|TYPE|ALPHA|CIPCTLNORMAL|CIQUANTNORMAL|TYPE|ALPHA|DATA|EXCLNPWGT|EXCLNPWGTS|FREQ|GOUT|IDOUT|LOCCOUNT|MODES|MODE|MU0|LOCATION|NEXTROBS|NEXTRVAL|NOBYPLOT|NOPRINT|NORMAL|NORMALTEST|NOTABCONTENTS|NOVARCONTENTS|OUTTABLE|PCTLDEF|DEF|PLOTS|PLOT|ODSFOOTNOTE|ODSTITLE|NONE|DEFAULT|LABELFMT|ODSTITLE2|PLOTSIZE|ROBUSTSCALE|ROUND|SUMMARYCONTENTS|TRIMMED|TRIM|TYPE|ALPHA|VARDEF|DF|N|WDF|WEIGHT|WGT|WINSORIZED|WINSOR|TYPE|ALPHA)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#proccorr": [{
                token: "storage.type.function.sas",
                regex: /\bcorr\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.proccorr.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA|OUT|OUTH|OUTK|OUTP|OUTPLC|OUTPLS|OUTS)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.proccorr.sas",
                        regex: /\bBY\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.proccorr.sas",
                                regex: /\b(?:NOTSORTED|DESCENDING)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proccorr.sas",
                        regex: /\b(?:WHERE|format|pageby|sumby|TITLE\d*|FOOTNOTE\d*|FREQ|ID|PARTIAL|VAR|WEIGHT|WITH|ALPHA|BEST|COV|CSSCP|EXCLNPWGT|EXCLNPWGTS|FISHER|BIASADJ|TYPE|RHO0|HOEFFDING|KENDALL|NOCORR|NOMISS|NOPRINT|NOPROB|NOSIMPLE|PEARSON|PLOTS|ALL|MATRIX|NONE|SCATTER|HISTOGRAM|NVAR|NWITH|ELLIPSE|ALPHA|ELLIPSE|NOINSET|NVAR|NWITH|POLYCHORIC|CONVERGE|MAXITER|NGROUPS|POLYSERIAL|CONVERGE|MAXITER|NGROUPS|ORDINAL|RANK|SINGULAR|SPEARMAN|SSCP|VARDEF)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#procfreq": [{
                token: "storage.type.function.sas",
                regex: /\bfreq\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.procfreq.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.procfreq.sas",
                        regex: /\bBY\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procfreq.sas",
                                regex: /\b(?:NOTSORTED|DESCENDING)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procfreq.exact.sas",
                        regex: /\bEXACT\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procfreq.exact.sas",
                                regex: /\b(?:AGREE|BARNARD|BINOMIAL|BIN|CHISQ|COMOR|EQOR|ZELEN|FISHER|JT|KAPPA|KENTB|TAUB|LRCHI|MCNEM|MEASURES|MHCHI|ODDSRATIO|OR|PCHI|PCORR|RELRISK|COLUMN|METHOD|RISKDIFF|SCORR|SMDCR|SMDRC|STUTC|TAUC|TREND|WTKAP|WTKAPPA|ALPHA|MAXTIME|MC|MIDP|N|PFORMAT|POINT|SEED)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procfreq.sas",
                        regex: /\boutput\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: [
                                    "keyword.language.procfreq.output.sas",
                                    "text",
                                    "entity.name.library.output.sas",
                                    "variable.variable.dataset.language.sas"
                                ],
                                regex: /\b(out)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                                caseInsensitive: true
                            }, {
                                token: "keyword.language.procfreq.output.sas",
                                regex: /\b(?:AGREE|AJCHI|ALL|BDCHI|BINOMIAL|BIN|CHISQ|CMH|CMH1|CMH2|CMHCOR|CMHGA|CMHRMS|COCHQ|CONTGY|CRAMV|EQKAP|EQOR|ZELEN|EQWKP|FISHER|GAMMA|GAILSIMON|GS|JT|KAPPA|KENTB|TAUB|LAMCR|LAMDAS|LAMRC|LGOR|LGRRC1|LGRRC2|LRCHI|MCNEM|MEASURES|MHCHI|MHOR|COMOR|MHRRC1|MHRRC2|N|NMISS|ODDSRATIO|OR|PROR|PCHI|PCORR|PHI|PLCORR|RDIF1|RDIF2|RELRISK|RISKDIFF|RISKDIFF1|RISKDIFF2|RRC2|RRC1|RI?SK1|RI?SK11|RI?SK12|RI?SK2|RI?SK21|RI?SK22|SCORR|SMDCR|SMDRC|STUTC|TAUC|TREND|TSYMM|BOWKER|UCR|U|URC|WTKAP|WTKAPPA)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procfreq.table.sas",
                        regex: /\bTABLES\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procfreq.table.sas",
                                regex: /\b(?:AGREE|AGREEPLOT|ALL|CUMFREQPLOT|DEVIATIONPLOT|FREQPLOT|KAPPAPLOT|MOSAICPLOT|COLORSTAT|SQUARE|NONE|ODDSRATIOPLOT|RELRISKPLOT|RISKDIFFPLOT|WTKAPPAPLOT|ONLY|CL|CLDISPLAY|COLUMN|COMMON|EXACT|GROUPBY|LOGBASE|LEGEND|NOSTAT|NPANELPOS|ORDER|ORIENT|PARTIAL|RANGE|SCALE|SHOWSCALE|STATS|TWOWAY|TYPE|PRINTKWTS|WT|ALL|ALPHA|BINOMIAL|BIN|CL|AGRESTICOULL|AC|BLAKER|EXACT|CLOPPERPEARSON|LIKELIHOODRATIO|JEFFREYS|LR|LOGIT|MIDP|WALD|WILSON|SCORE|CORRECT|EQUIV|EQUIVALENCE|LEVEL|MARGIN|NONINF|NONINFERIORITY|OUTLEVEL|P|SUP|SUPERIORITY|VAR|CELLCHI2|CHISQ|DF|LRCHI|TESTF|TESTP|WARN|CL|CMH|CMH1|CMH2|FISHER|GAILSIMON|JT|MEASURES|MISSING|OR|PLCORR|RELRISK|RISKDIFF|SCORES|TREND|CUMCOL|CELLCHI2|DEVIATION|EXPECTED|MISSPRINT|PEARSONRES|PRINTKWTS|SCOROUT|SPARSE|STDRES|TOTPCT|CONTENTS|CROSSLIST|FORMAT|LIST|MAXLEVELS|NOCOL|NOCUM|NOFREQ|NOPERCENT|NOPRINT|NOROW|NOSPARSE|NOWARN|PLOTS|OUT|OUTCUM|OUTEXPECT|OUTPCT)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procfreq.test.sas",
                        regex: /\btest\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procfreq.test.sas",
                                regex: /\b(?:AGREE|KAPPA|KENTB|TAUB|MEASURES|PCORR|PLCORR|SCORR|SMDCR|SMDRC|STUTC|TAUC|WTKAP|WTKAPPA)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procfreq.sas",
                        regex: /\b(?:WHERE|format|pageby|sumby|TITLE\d*|FOOTNOTE\d*|COMPRESS|FORMCHAR|NLEVELS|NOPRINT|ORDER|PAGE|WEIGHT|ZEROS)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#procrank": [{
                token: "storage.type.function.sas",
                regex: /\brank\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.procrank.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA|OUT)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.procrank.sas",
                        regex: /\bBY\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procrank.sas",
                                regex: /\b(?:NOTSORTED|DESCENDING)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procrank.sas",
                        regex: /\b(?:WHERE|format|pageby|sumby|TITLE\d*|FOOTNOTE\d*|VAR|RANKS|DESCENDING|FRACTION|GROUPS|NORMAL|NPLUS1|PRESERVERAWBYVALUES|PERCENT|SAVAGE|TIES)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#procprint": [{
                token: "storage.type.function.sas",
                regex: /\bprint\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.procprint.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.procprint.sas",
                        regex: /\bBY\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procprint.sas",
                                regex: /\b(?:NOTSORTED|DESCENDING)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procprint.sas",
                        regex: /\b(?:WHERE|format|pageby|sumby|TITLE\d*|FOOTNOTE\d*|ID|SUM|VAR|CONTENTS|GRANDTOTAL_LABEL|HEADING|LABEL|SPLIT|(?:NO)?SUMLABEL|STYLE|BLANKLINE|DOUBLE|N|(?:NO)?OBS|ROUND|ROW|UNIFORM|WIDTH)\b/,
                        caseInsensitive: true
                    }, {
                        include: "#style"
                    }]
            }],
        "#procexport": [{
                token: "storage.type.function.sas",
                regex: /\bEXPORT\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.procexport.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.procexport.sas",
                        regex: /\b(?:OUTFILE|OUTTABLE|DBMS|REPLACE|LABEL|DELIMITER|PUTNAMES|DBENCODING|FMTLIB|META)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#procdatasets": [{
                token: "storage.type.function.sas",
                regex: /\bdatasets\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=quit)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.procdatasets.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(BASE|DATA|OUT)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.procdatasets.sas",
                        regex: /\b(?:lib|run|title\d*|ALTER|(?:NO)?DETAILS|ENCRYPTKEY|FORCE|GENNUM|KILL|LIBRARY|MEMTYPE|NOLIST|NOPRINT|NOWARN|PW|READ|AGE|APPEND|ATTRIB|AUDIT|CHANGE|CONTENTS|COPY|DELETE|EXCHANGE|EXCLUDE|FORMAT|IC CREATE|IC DELETE|IC REACTIVATE|INDEX CENTILES|INDEX CREATE|INDEX DELETE|INFORMAT|INITIATE|LABEL|LOG|MODIFY|REBUILD|RENAME|REPAIR|RESUME|SAVE|SELECT|SUSPEND|TERMINATE|USER_VAR|XATTR ADD|XATTR DELETE|XATTR OPTIONS|XATTR REMOVE|XATTR SET|XATTR UPDATE|ALTER|MEMTYPE|APPENDVER|ENCRYPTKEY|FORCE|GETSORT|AUDIT_ALL|ADMIN_IMAGE|BEFORE_IMAGE|DATA_IMAGE|ERROR_IMAGE|VARNUM|SHORT|ORDER|NOPRINT|NODETAILS|NODS|FMTLEN|DIRECTORY|CENTILES|(?:NO)?CLONE|CONSTRAINT|DATECOPY|INDEX|MOVE|OVERRIDE|CORRECTENCODING|ENCRYPTKEY|DTC|GENMAX|GENNUM|LABEL|SORTEDBY|TYPE|WRITE)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#proccontents": [{
                token: "storage.type.function.sas",
                regex: /\bcontents\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.proccompare.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA|OUT)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.proccontents.sas",
                        regex: /\btitle\d*\b/,
                        caseInsensitive: true
                    }]
            }],
        "#proccatalog": [{
                token: "storage.type.function.sas",
                regex: /\bcatalog\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=quit)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: "keyword.language.proccatalog.sas",
                        regex: /\b(?:title\d*|run|select|catalog|contents|exclude|copy|CHANGE|EXCHANGE|DELETE|MODIFY|SAVE|ENTRYTYPE|FORCE|KILL)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#procprintto": [{
                token: "storage.type.function.sas",
                regex: /\bprintto\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: "keyword.language.procprintto.sas",
                        regex: /\b(?:file|LABEL|LOG|NEW|PRINT|UNIT)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#procreport": [{
                token: "storage.type.function.sas",
                regex: /\breport\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.proccompare.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(DATA|OUT|OUTREPT)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.procreport.sas",
                        regex: /\bDEFINE\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                token: "keyword.language.procreport.sas",
                                regex: /\b(?:MIN|MAX|SUM|CENTER|COLOR|LEFT|RIGHT|EXCLUSIVE|FORMAT|MISSING|MLF|ORDER|PRELOADFMT|SPACING|STYLE|WEIGHT|WIDTH|ACROSS|ANALYSIS|COMPUTED|DISPLAY|GROUP|ORDER|CONTENTS|DESCENDING|FLOW|ID|NOPRINT|NOZERO|PAGE)\b/,
                                caseInsensitive: true
                            }, {
                                include: "#style"
                            }]
                    }, {
                        token: "keyword.language.procreport.sas",
                        regex: /\b(?:BREAK|RBREAK)\b\s*(?:BEFORE|AFTER)?/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                token: "keyword.language.procreport.sas",
                                regex: /\b(?:COLOR|CONTENTS|DOL|DUL|OL|PAGE|SKIP|STYLE|SUMMARIZE|SUPPRESS|UL)\b/,
                                caseInsensitive: true
                            }, {
                                include: "#style"
                            }]
                    }, {
                        token: "keyword.language.procreport.compute.sas",
                        regex: /\bCOMPUTE\b\s*(?:BEFORE|AFTER)?/,
                        caseInsensitive: true,
                        push: [{
                                token: "keyword.language.procreport.compute.sas",
                                regex: /\bendcomp\s*;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#dataassignment"
                            }, {
                                token: "keyword.language.procreport.sas",
                                regex: /\b(?:COLOR|LINE|CONTENTS|DOL|DUL|OL|PAGE|SKIP|STYLE|SUMMARIZE|SUPPRESS|UL)\b/,
                                caseInsensitive: true
                            }, {
                                include: "#style"
                            }]
                    }, {
                        token: "keyword.language.procreport.sas",
                        regex: /\bBY\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procreport.sas",
                                regex: /\b(?:NOTSORTED|DESCENDING)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procreport.sas",
                        regex: /\b(?:WHERE|FORMAT|COMPUTE|ENDCOMP|LINE|CALL +DEFINE|COLUMN|title\d*|WEIGHT|FREQ|NOALIAS|(?:NO)?CENTER|(?:NO)?COMPLETECOLS|(?:NO)?COMPLETEROWS|(?:NO)?THREADS|(?:NO)?WINDOWS|PCTLDEF|(?:NO)?THREADS|(?:NO)?WINDOWS|CONTENTS|SPANROWS|STYLE|COMMAND|HELP|PROMPT|BOX|BYPAGENO|(?:NO)?CENTER|COLWIDTH|FORMCHAR|LS|MISSING|PANELS|SHOWALL|SPACING|WRAP|EXCLNPWGT|QMARKERS|QMETHOD|QNTLDEF|VARDEF|NAMED|NOHEADER|SPLIT|HEADLINE|HEADSKIP|LIST|NOEXEC|OUTREPT|PROFILE|REPORT)\b/,
                        caseInsensitive: true
                    }, {
                        include: "#style"
                    }]
            }],
        "#procformat": [{
                token: "storage.type.function.sas",
                regex: /\bformat\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: "keyword.language.procformat.sas",
                        regex: /\bPICTURE\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                token: "keyword.language.procformat.sas",
                                regex: /\b(?:mult|FILL|MULTIPLIER|NOEDIT|PREFIX|DATATYPE|DECSEP|DEFAULT|DIG3SEP|FUZZ|LANGUAGE|MAX|MIN|MULTILABEL|NOTSORTED|ROUND)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procformat.sas",
                        regex: /\b(?:INVALUE|VALUE)\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                include: "#specialparser"
                            }, {
                                include: "#format"
                            }, {
                                token: "keyword.language.procformat.sas",
                                regex: /\b(?:DEFAULT|FUZZ|JUST|MAX|MIN|NOTSORTED|UPCASE)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procformat.sas",
                        regex: /\b(?:select|title\d*|EXCLUDE|INVALUE|FMTLIB|LIBRARY|LOCALE|MAXLABLEN|MAXSELEN|NOREPLACE|PAGE)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#proccompare": [{
                token: "storage.type.function.sas",
                regex: /\bcompare\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.proccompare.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(out|COMPARE|BASE|OUTSTATS)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.proccompare.sas",
                        regex: /\b(?:BY|ID)\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.proccompare.sas",
                                regex: /\b(?:NOTSORTED|DESCENDING)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proccompare.sas",
                        regex: /\b(?:title\d*|criteria|VAR|WITH|ALLOBS|ALLSTATS|ALLVARS|BRIEFSUMMARY|CRITERION|ERROR|FUZZ|LISTALL|LISTBASE|LISTBASEOBS|LISTBASEVAR|LISTCOMP|LISTCOMPOBS|LISTCOMPVAR|LISTEQUALVAR|LISTOBS|LISTVAR|MAXPRINT|METHOD|NODATE|NOMISSBASE|NOMISSCOMP|NOMISSING|NOPRINT|NOSUMMARY|NOTE|NOVALUES|OUTALL|OUTBASE|OUTCOMP|OUTDIF|OUTNOEQUAL|OUTPERCENT|PRINTALL|STATS|TRANSPOSE|WARNING)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#proctranspose": [{
                token: "storage.type.function.sas",
                regex: /\btranspose\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.proctranspose.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(out|data)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.proctranspose.sas",
                        regex: /\bby\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.proctranspose.sas",
                                regex: /\b(?:NOTSORTED|DESCENDING)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.proctranspose.sas",
                        regex: /\b(?:WHERE|COPY|ID|IDLABEL|VAR|DELIMITER|INDB|LABEL|LET|NAME|PREFIX|SUFFIX)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#procsort": [{
                token: "storage.type.function.sas",
                regex: /\bsort\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: [
                            "keyword.language.procsort.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(out|data|dupout|uniqueout|)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.procsort.sas",
                        regex: /\bby\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procsort.sas",
                                regex: /\b(?:NOTSORTED|DESCENDING)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procsort.sas",
                        regex: /\b(?:where|ASCII|DATECOPY|FORCE|OVERWRITE|PRESORTED|REVERSE|SORTSIZE|TAGSORT|NODUPKEY|NOUNIQUEKEY|NOTHREADS|THREADS|NOTHREADS|NOEQUALS|EQUALS|DANISH|EBCDIC|FINNISH|NATIONAL|NORWEGIAN|POLISH|SWEDISH|SORTSEQ|KEYDESCENDING|ASCENDING)\b/,
                        caseInsensitive: true
                    }]
            }],
        "#procmeans": [{
                token: "storage.type.function.sas",
                regex: /\b(?:means|summary)\b/,
                caseInsensitive: true,
                push: [{
                        token: "text",
                        regex: /\b(?=run)\b/,
                        caseInsensitive: true,
                        next: "pop"
                    }, {
                        include: "#specialparser"
                    }, {
                        token: "keyword.language.procmeans.sas",
                        regex: /\bby\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procmeans.sas",
                                regex: /\b(?:NOTSORTED|DESCENDING)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procmeans.sas",
                        regex: /\bclass\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: "keyword.language.procmeans.sas",
                                regex: /\b(?:ASCENDING|DESCENDING|EXCLUSIVE|GROUPINTERNAL|MISSING|MLF|ORDER|PRELOADFMT)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: [
                            "keyword.language.procmeans.sas",
                            "text",
                            "entity.name.library.sas",
                            "variable.variable.dataset.language.sas"
                        ],
                        regex: /\b(data|classdata)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.procmeans.sas",
                        regex: /\boutput\b/,
                        caseInsensitive: true,
                        push: [{
                                token: "text",
                                regex: /;/,
                                next: "pop"
                            }, {
                                token: [
                                    "keyword.language.procmeans.sas",
                                    "text",
                                    "entity.name.library.sas",
                                    "variable.variable.dataset.language.sas"
                                ],
                                regex: /\b(out)\b(\s*=\s*)((?:[A-z_]\w*\.)?)([A-z_]\w*)/,
                                caseInsensitive: true
                            }, {
                                token: "keyword.language.procmeans.sas",
                                regex: /\b(?:OUT|MAX|N|MIN|MEAN|CSS|CV|MODE|MEDIAN|KURT|NMISS|P1|P50|Q1|P75|PRT|STD|RANGE|SKEW|STDERR|SUM|SUMWGT|VAR|Q3|T|AUTOLABEL|AUTONAME|KEEPLEN|LEVELS|NOINHERIT|WAYS)\b/,
                                caseInsensitive: true
                            }]
                    }, {
                        token: "keyword.language.procmeans.sas",
                        regex: /\b(?:FORMAT|ID|WHERE|FREQUENCY|FREQ|ID|WEIGHT|WAY|TYPES|VAR|VARS|VARIABLE|VARIABLES|WGT)\b/,
                        caseInsensitive: true
                    }, {
                        token: "keyword.language.procmeans.sas",
                        regex: /\b(?:ALPHA|CHARTYPE|CLASSDATA|COMPLETETYPES|DESCENDTYPES|DESCENDING|DESCEND|EXCLNPWGT|EXCLNPWGTS|EXCLUSIVE|FW|IDMIN|MAXDEC|MISSING|NONOBS|PRINT|NOPRINT|THREADS|NOTHREADS|NOTRAP|NWAY|ORDER|QNTLDEF|PCTLDEF|PRINTALLTYPES|PRINTALL|PRINTIDVARS|PRINTIDS|QMARKERS|QMETHOD|SUMSIZE|VARDEF|CSS|CV|KURTOSIS|KURT|LCLM|MAX|MEAN|MIN|MODE|N|NMISS|RANGE|SKEWNESS|SKEW|STD|STDDEV|STDERR|SUM|SUMWGT|UCLM|USS|VAR|MEDIAN|P50|P1|P5|P10|Q1|P25|Q3|P75|P90|P95|P99|QRANGE|PROBT|PRT|T)\b/,
                        caseInsensitive: true
                    }]
            }]
    };
    this.normalizeRules();
};
sasHighlightRules.metaData = {
    "$schema": "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
    name: "sas",
    scopeName: "source.sas"
};
oop.inherits(sasHighlightRules, TextHighlightRules);
exports.sasHighlightRules = sasHighlightRules;

});

ace.define("ace/mode/folding/cstyle",[], function(require, exports, module){"use strict";
var oop = require("../../lib/oop");
var Range = require("../../range").Range;
var BaseFoldMode = require("./fold_mode").FoldMode;
var FoldMode = exports.FoldMode = function (commentRegex) {
    if (commentRegex) {
        this.foldingStartMarker = new RegExp(this.foldingStartMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.start));
        this.foldingStopMarker = new RegExp(this.foldingStopMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.end));
    }
};
oop.inherits(FoldMode, BaseFoldMode);
(function () {
    this.foldingStartMarker = /([\{\[\(])[^\}\]\)]*$|^\s*(\/\*)/;
    this.foldingStopMarker = /^[^\[\{\(]*([\}\]\)])|^[\s\*]*(\*\/)/;
    this.singleLineBlockCommentRe = /^\s*(\/\*).*\*\/\s*$/;
    this.tripleStarBlockCommentRe = /^\s*(\/\*\*\*).*\*\/\s*$/;
    this.startRegionRe = /^\s*(\/\*|\/\/)#?region\b/;
    this._getFoldWidgetBase = this.getFoldWidget;
    this.getFoldWidget = function (session, foldStyle, row) {
        var line = session.getLine(row);
        if (this.singleLineBlockCommentRe.test(line)) {
            if (!this.startRegionRe.test(line) && !this.tripleStarBlockCommentRe.test(line))
                return "";
        }
        var fw = this._getFoldWidgetBase(session, foldStyle, row);
        if (!fw && this.startRegionRe.test(line))
            return "start"; // lineCommentRegionStart
        return fw;
    };
    this.getFoldWidgetRange = function (session, foldStyle, row, forceMultiline) {
        var line = session.getLine(row);
        if (this.startRegionRe.test(line))
            return this.getCommentRegionBlock(session, line, row);
        var match = line.match(this.foldingStartMarker);
        if (match) {
            var i = match.index;
            if (match[1])
                return this.openingBracketBlock(session, match[1], row, i);
            var range = session.getCommentFoldRange(row, i + match[0].length, 1);
            if (range && !range.isMultiLine()) {
                if (forceMultiline) {
                    range = this.getSectionRange(session, row);
                }
                else if (foldStyle != "all")
                    range = null;
            }
            return range;
        }
        if (foldStyle === "markbegin")
            return;
        var match = line.match(this.foldingStopMarker);
        if (match) {
            var i = match.index + match[0].length;
            if (match[1])
                return this.closingBracketBlock(session, match[1], row, i);
            return session.getCommentFoldRange(row, i, -1);
        }
    };
    this.getSectionRange = function (session, row) {
        var line = session.getLine(row);
        var startIndent = line.search(/\S/);
        var startRow = row;
        var startColumn = line.length;
        row = row + 1;
        var endRow = row;
        var maxRow = session.getLength();
        while (++row < maxRow) {
            line = session.getLine(row);
            var indent = line.search(/\S/);
            if (indent === -1)
                continue;
            if (startIndent > indent)
                break;
            var subRange = this.getFoldWidgetRange(session, "all", row);
            if (subRange) {
                if (subRange.start.row <= startRow) {
                    break;
                }
                else if (subRange.isMultiLine()) {
                    row = subRange.end.row;
                }
                else if (startIndent == indent) {
                    break;
                }
            }
            endRow = row;
        }
        return new Range(startRow, startColumn, endRow, session.getLine(endRow).length);
    };
    this.getCommentRegionBlock = function (session, line, row) {
        var startColumn = line.search(/\s*$/);
        var maxRow = session.getLength();
        var startRow = row;
        var re = /^\s*(?:\/\*|\/\/|--)#?(end)?region\b/;
        var depth = 1;
        while (++row < maxRow) {
            line = session.getLine(row);
            var m = re.exec(line);
            if (!m)
                continue;
            if (m[1])
                depth--;
            else
                depth++;
            if (!depth)
                break;
        }
        var endRow = row;
        if (endRow > startRow) {
            return new Range(startRow, startColumn, endRow, line.length);
        }
    };
}).call(FoldMode.prototype);

});

ace.define("ace/mode/folding/sas",[], function(require, exports, module){"use strict";
var oop = require("../../lib/oop");
var BaseFoldMode = require("./cstyle").FoldMode;
var Range = require("../../range").Range;
var TokenIterator = require("../../token_iterator").TokenIterator;
var FoldMode = exports.FoldMode = function () { };
oop.inherits(FoldMode, BaseFoldMode);
(function () {
    var _this = this;
    this.getFoldWidgetRangeBase = this.getFoldWidgetRange;
    this.getFoldWidgetBase = this.getFoldWidget;
    this.indentKeywordsSAS = {
        "proc": 1,
        "data": 1,
        "run": -1,
        "quit": -1,
        "do": 1,
        "select": 1,
        "end": -1,
        "%macro": 1,
        "%mend": -1,
        "%do": 1,
        "%end": -1,
    };
    this.tokenTypeSAS = [
        "storage.type.class.sas",
        "keyword.control.conditional.sas",
        "keyword.control.general.sas",
        "support.class.character-class.sas",
    ];
    this.foldingStartMarkerSAS = /(^\s*|;\s*)(proc|data|do|select|%macro|%do)\b|(then\s*|else\s*)(do|%do)\b/i;
    this.foldingStopMarkerSAS = /(;\s*|^\s*)(run|quit\s*\w*|end|%mend\s*\w*|%end)\s*(?=;|$)/i;
    this.testMarkerSAS = function (line) { return ({
        isStart: _this.foldingStartMarkerSAS.test(line),
        isEnd: _this.foldingStopMarkerSAS.test(line)
    }); };
    this.getStartMarkerSAS = function (line) {
        var match = this.foldingStartMarkerSAS.exec(line);
        if (!match)
            return {};
        return {
            keyword: (match[2] || match[4] || '').toLowerCase(),
            index: match.index + 1 + (match[1] || match[3] || '').length,
        };
    };
    this.getStopMarkerSAS = function (line) {
        var match = this.foldingStopMarkerSAS.exec(line);
        if (!match)
            return {};
        return {
            keyword: (match[2] || match[4] || '').toLowerCase().split(/\s+/)[0],
            index: match.index + 1 + (match[1] || match[3] || '').length,
        };
    };
    this.getFoldWidgetRange = function (session, foldStyle, row) {
        var line = session.getLine(row);
        var marker = this.testMarkerSAS(line);
        if (marker.isStart || marker.isEnd) {
            var match = (marker.isEnd) ? this.getStopMarkerSAS(line) : this.getStartMarkerSAS(line);
            if (match.keyword) {
                var type = session.getTokenAt(row, match.index).type;
                if (this.tokenTypeSAS.includes(type))
                    return this.sasBlock(session, row, match.index);
            }
        }
        return this.getFoldWidgetRangeBase(session, foldStyle, row);
    };
    this.getFoldWidget = function (session, foldStyle, row) {
        var line = session.getLine(row);
        var marker = this.testMarkerSAS(line);
        if (marker.isStart && !marker.isEnd) {
            var match = this.getStartMarkerSAS(line);
            if (match.keyword) {
                var type = session.getTokenAt(row, match.index).type;
                if (this.tokenTypeSAS.includes(type))
                    return "start";
            }
        }
        if (foldStyle != "markbeginend" || !marker.isEnd || marker.isStart && marker.isEnd)
            return this.getFoldWidgetBase(session, foldStyle, row);
        var match = this.getStopMarkerSAS(line);
        if (this.indentKeywordsSAS[match.keyword]) {
            var token = session.getTokenAt(row, match.index);
            var type = token.type;
            if (this.tokenTypeSAS.includes(type))
                return "end";
        }
        return this.getFoldWidgetBase(session, foldStyle, row);
    };
    this.sasBlock = function (session, row, column, tokenRange) {
        var stream = new TokenIterator(session, row, column);
        var token = stream.getCurrentToken();
        if (!token || !this.tokenTypeSAS.includes(token.type))
            return;
        var val = token.value.toLowerCase();
        var stack = [val];
        var dir = this.indentKeywordsSAS[val];
        if (!dir)
            return;
        var startColumn = dir === -1 ? stream.getCurrentTokenColumn() : session.getLine(row).length;
        var startRow = row;
        stream.step = dir === -1 ? stream.stepBackward : stream.stepForward;
        while (token = stream.step()) {
            val = token.value.toLowerCase();
            if (!this.tokenTypeSAS.includes(token.type) || !this.indentKeywordsSAS[val])
                continue;
            var level = dir * this.indentKeywordsSAS[val];
            if (level > 0) {
                stack.unshift(val);
            }
            else if (level <= 0) {
                stack.shift();
            }
            if (stack.length === 0) {
                break;
            }
        }
        if (!token)
            return null;
        if (tokenRange)
            return stream.getCurrentTokenRange();
        var row = stream.getCurrentTokenRow();
        if (dir === -1)
            return new Range(row, session.getLine(row).length, startRow, startColumn);
        else
            return new Range(startRow, startColumn, row, stream.getCurrentTokenColumn());
    };
}).call(FoldMode.prototype);

});

ace.define("ace/mode/sas",[], function(require, exports, module){/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2012, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */
"use strict";
var oop = require("../lib/oop");
var TextMode = require("./text").Mode;
var sasHighlightRules = require("./sas_highlight_rules").sasHighlightRules;
var FoldMode = require("./folding/sas").FoldMode;
var Mode = function () {
    this.HighlightRules = sasHighlightRules;
    this.foldingRules = new FoldMode();
    this.$behaviour = this.$defaultBehaviour;
};
oop.inherits(Mode, TextMode);
(function () {
    this.blockComment = { start: "/* ", end: " */" };
    this.$id = "ace/mode/sas";
    this.snippetFileId = "ace/snippets/sas";
}).call(Mode.prototype);
exports.Mode = Mode;

});                (function() {
                    ace.require(["ace/mode/sas"], function(m) {
                        if (typeof module == "object" && typeof exports == "object" && module) {
                            module.exports = m;
                        }
                    });
                })();
            