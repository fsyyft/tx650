// Cursor Controller for Network Media Player
// ver 1.0.0.0
// require jQuery.js
// @20130613

var NMP = NMP || {};
$(function($) {
	NMP.Controller = function() {
		this.init.apply(this, arguments);
	};
	NMP.Controller.prototype = {
		// Keycode用定数
		// rtlのときはinitで判定して左右を入れ替える
		KEYCODE_LEFT: 37,
		KEYCODE_UP: 38,
		KEYCODE_RIGHT: 39,
		KEYCODE_DOWN: 40,

		// フォーカス現在位置エリアの記録用定数
		POSITION_LIST: 'list',
		POSITION_MENU: 'menu',
		POSITION_PAGE_NAV: 'page_nav',
		POSITION_SEARCH_INPUT: 'search_input',
		POSITION_SEARCH: 'search',

		// フォーカス移動のコマンド用定数
		COMMAND_FORWARD: "forward",
		COMMAND_BACK: "back",
		COMMAND_MOVE_AREA: "movearea",

		// 各フォルダ名の定義
		FOLDER_COVER: "cover",
		FOLDER_CONTENTS: "contents",
		FOLDER_SEARCH: "search",

		init: function() {
			// フォーカス位置の初期値：-1はフォーカスがない
			this.cursorPositionIndex = -1;

			// フォーカス移動先のanchorタグのリストを取得
			this.menuItems = $('A', $('#menu')); // 左側ナビゲーション
			this.listItems = $('A', $(".list")); // 右側リスト
			this.pageNavigators = $('A', $('UL', $('.page-nav'))); // ページナビゲーション（Back, Back to Top）
			this.searchResultPages = $('A', $('#id_search_status')); // 検索ページ遷移（検索結果ページのみ）, initでは取得できないので、初期フォーカス位置算出時に取得する
			this.searchKeywordInput = $('#id_search'); // 検索キーワード入力エリアのみinputタグをid指定

			// keydownイベントにハンドラを登録
			$(window).keydown($.proxy(this.keydown, this));

			// rtlでは左右逆転するため、定数値を変更する
			if(document.documentElement.getAttribute('dir') == 'rtl'){
				this.KEYCODE_LEFT = 39;
				this.KEYCODE_RIGHT = 37;
			}

		},

		// keydownイベント
		keydown: function(e) {
			// keydownの戻り値をfalseにすると、カーソルキーによるスクロールなど本来の操作がキャンセルされる
			// フォーカス移動時はキー入力によるスクロールを発生させないため、フォーカス移動メソッドの実行結果でキー操作のキャンセルを決める
			var returnValue = true;

			// AltKey押下時はカーソルキーでフォーカスを移動しない
			if(e.altKey){
				return returnValue;
			}

			// 最初はカーソルキーのうち、どのキーを押しても初期位置がフォーカスされる
			if((this.cursorPositionIndex == -1) &&
				((e.keyCode == this.KEYCODE_LEFT) || (e.keyCode == this.KEYCODE_UP) || (e.keyCode == this.KEYCODE_RIGHT) || (e.keyCode == this.KEYCODE_DOWN))){
				// 初期位置はページ種類ごとに決める
				// ページ種類はファイルの格納されているフォルダ名から判定する
				var firstTarget;
				var firstPosition;
				var folderName = this.getLastFolderName();	// ファイルの格納先フォルダ名を取得

				if((folderName == this.FOLDER_COVER) || (folderName == this.FOLDER_SEARCH)){
					// 扉ページ、検索結果ページの場合は、右側リストにフォーカスを当てる
					// 検索結果画面では右側リストのjQueryセレクタが変わるので、検索結果ページの場合は条件を変えて再取得する
					// 検索結果はscriptで構築されるため、init実行時には取得できないので、初期フォーカス位置計算時に取得すること
					if(folderName == this.FOLDER_SEARCH){
						this.listItems = $('A', $(".list" + ".impact"));
						this.searchResultPages = $('A', $('#id_search_status')); // 検索ページ遷移（検索結果ページのみ）
					}
					firstTarget = this.listItems;
					firstPosition = this.POSITION_LIST;

				}else if(folderName == this.FOLDER_CONTENTS){
					// コンテンツページの場合は、ページナビゲーションにフォーカスを当てる
					// ただし、右側リストが存在するコンテンツ一覧ページでは、右側リストにフォーカスを当てる
					if(this.listItems.size() > 0){
						firstTarget = this.listItems;
						firstPosition = this.POSITION_LIST;

					}else{
						firstTarget = this.pageNavigators;
						firstPosition = this.POSITION_PAGE_NAV;
					}

				}else{
					// 上記以外の場合（トップページのみ）は、左側ナビゲーションにフォーカスを当てる
					firstTarget = this.menuItems;
					firstPosition = this.POSITION_MENU;
				}

				// 指定の位置の最初のオブジェクトにフォーカスを当てる
				this.setFocusForMoveArea(firstTarget, 0, firstPosition);

				// キー操作はキャンセルする
				returnValue = false;

			}else{
				// フォーカスを移動する
				returnValue = this.calcurateFocusPosition(e);
			}

			return returnValue;
		},

		// 渡されたオブジェクトセットのうち、指定のindexを持つオブジェクトにフォーカスを当てる
		// 以降、渡されたオブジェクトセットがカーソルキーの操作対象になる
		setFocusForMoveArea: function(items, index, movetoPositionStatus){
			if(items.size() > 0){
				// フォーカス対象が検索キーワード入力エリアの場合は、クリックイベントを発生させる
				// 入力エリアのvalueがデフォルト文字列のときは、クリックイベントにより文字が削除される
				if(movetoPositionStatus == this.POSITION_SEARCH_INPUT){
					items.eq(0).click();
				}

				// 指定のindexにフォーカスを当てる
				items.eq(index).focus();

				// 操作対象オブジェクトを更新
				this.targetItems = items;

				// フォーカス位置を更新
				this.cursorPositionIndex = index;

				// 現在位置エリアを更新
				this.PositionStatus = movetoPositionStatus;
			}
		},

		// 現在のフォーカス位置とキーコードからフォーカスの移動先を指示するコマンドを構築し、フォーカスを移動するメソッドに引き渡す
		calcurateFocusPosition: function(e){
			// 移動先指定コマンドを構成する変数を初期化
			var command = "";
			var targetItems = this.targetItems;
			var movetoItems = null;
			var movetoIndexForMoveArea = -1;
			var movetoPositionStatus = "";

			switch(e.keyCode){
				case 13: // Enter
					if(this.PositionStatus == this.POSITION_SEARCH){
						// 検索ページ遷移エリアでEnterを押したときはフォーカス位置をリセットして、続いての操作で初期位置がフォーカスされるようにする
						// 検索ページ遷移以外であれば、表示ファイルが変わるためScriptがリロードされて初期状態になる
						this.cursorPositionIndex = -1;
					}

					break;

				case this.KEYCODE_LEFT: // ←
					if(this.PositionStatus == this.POSITION_LIST){
						// 現在位置が右側リストのときは左側ナビゲーションにエリア移動
						command = this.COMMAND_MOVE_AREA;
						movetoItems = this.menuItems;
						movetoIndexForMoveArea = 0;
						movetoPositionStatus = this.POSITION_MENU;

					}else if(this.PositionStatus == this.POSITION_PAGE_NAV){
						if(this.cursorPositionIndex == 0){
							// 現在位置がページナビゲーションエリアで、左端のアイテムである場合は左側ナビゲーションにエリア移動
							command = this.COMMAND_MOVE_AREA;
							movetoItems = this.menuItems;
							movetoIndexForMoveArea = 0;
							movetoPositionStatus = this.POSITION_MENU;

						}else{
							// 左端のアイテムでなければ、前に戻る
							command = this.COMMAND_BACK;
						}

					}else if(this.PositionStatus == this.POSITION_SEARCH){
						// 現在位置が検索ページ遷移エリアであれば、前に戻る
						command = this.COMMAND_BACK;
					}

					break;

				case this.KEYCODE_UP: // ↑
					if(this.PositionStatus == this.POSITION_SEARCH){
						// 現在位置が検索ページ遷移のときは右側リストにエリア移動
						// フォーカス移動先は右側リストの末尾項目
						command = this.COMMAND_MOVE_AREA;
						movetoItems = this.listItems;
						movetoIndexForMoveArea = movetoItems.length-1;
						movetoPositionStatus = this.POSITION_LIST;

					}else if(this.PositionStatus == this.POSITION_LIST){
						if(this.cursorPositionIndex == 0){
							// 現在位置が右側リスト、かつ最上段のときは以下のどちらかにエリア移動
							if(this.pageNavigators.size() != 0){
								// ページナビゲーションがあれば、優先的に移動先とする
								command = this.COMMAND_MOVE_AREA;
								movetoItems = this.pageNavigators;
								movetoIndexForMoveArea = 0;
								movetoPositionStatus = this.POSITION_PAGE_NAV;

							}else if(this.searchKeywordInput != null){
								// ページナビゲーションがなければ、検索キーワード入力エリアに移動する
								command = this.COMMAND_MOVE_AREA;
								movetoItems = this.searchKeywordInput;
								movetoIndexForMoveArea = 0;
								movetoPositionStatus = this.POSITION_SEARCH_INPUT;
							}

						}else{
							// 右側リストであっても、最上段でなければ前に戻る
							command = this.COMMAND_BACK;
						}

					}else if(this.PositionStatus == this.POSITION_PAGE_NAV){
						// 現在位置がページナビゲーションエリアのときは、検索キーワード入力エリアに移動
						command = this.COMMAND_MOVE_AREA;
						movetoItems = this.searchKeywordInput;
						movetoIndexForMoveArea = 0;
						movetoPositionStatus = this.POSITION_SEARCH_INPUT;

					}else if((this.PositionStatus == this.POSITION_MENU) && (this.cursorPositionIndex == 0)){
						// 現在位置が左側ナビゲーション、かつ最上段のときは、検索キーワード入力エリアに移動
						command = this.COMMAND_MOVE_AREA;
						movetoItems = this.searchKeywordInput;
						movetoIndexForMoveArea = 0;
						movetoPositionStatus = this.POSITION_SEARCH_INPUT;

					}else{
						// 前に戻る
						command = this.COMMAND_BACK;
					}

					break;

				case this.KEYCODE_RIGHT: // →
					if(this.PositionStatus == this.POSITION_MENU){
						if(this.listItems.size() != 0){
							// 現在位置が左側ナビゲーションのときは右側リストにエリア移動
							command = this.COMMAND_MOVE_AREA;
							movetoItems = this.listItems;
							movetoIndexForMoveArea = 0;
							movetoPositionStatus = this.POSITION_LIST;

						}else if(this.pageNavigators.size() != 0){
							// 右側リストがなければ、ページナビゲーションにエリア移動
							command = this.COMMAND_MOVE_AREA;
							movetoItems = this.pageNavigators;
							movetoIndexForMoveArea = 0;
							movetoPositionStatus = this.POSITION_PAGE_NAV;
						}

					}else if(this.PositionStatus == this.POSITION_SEARCH ||
							 this.PositionStatus == this.POSITION_PAGE_NAV){
						// 現在位置が検索ページ遷移エリア、またはページナビゲーションエリアであれば、次に進む
						command = this.COMMAND_FORWARD;
					}

					break;

				case this.KEYCODE_DOWN: // ↓
					if(this.PositionStatus == this.POSITION_LIST){
						if((this.cursorPositionIndex == this.listItems.length-1) && (this.searchResultPages.size() != 0)){
							// 右側リストで最下段、かつ検索ページ遷移エリアが存在するときはエリア移動
							command = this.COMMAND_MOVE_AREA;
							movetoItems = this.searchResultPages;
							movetoIndexForMoveArea = 0;
							movetoPositionStatus = this.POSITION_SEARCH;

						}else{
							// 右側リストであっても、最下段でなければ次に進む
							command = this.COMMAND_FORWARD;
						}

					}else if(this.PositionStatus == this.POSITION_PAGE_NAV){
						if(this.listItems.size() != 0){
							// 現在位置がページナビゲーションエリアのときは、右側リストにエリア移動
							command = this.COMMAND_MOVE_AREA;
							movetoItems = this.listItems;
							movetoIndexForMoveArea = 0;
							movetoPositionStatus = this.POSITION_LIST;
						}

					}else if(this.PositionStatus == this.POSITION_SEARCH_INPUT){
						if(this.pageNavigators.size() != 0){
							// 現在位置が検索キーワード入力エリアのときは、ページナビゲーションにエリア移動
							command = this.COMMAND_MOVE_AREA;
							movetoItems = this.pageNavigators;
							movetoIndexForMoveArea = 0;
							movetoPositionStatus = this.POSITION_PAGE_NAV;

						}else if(this.listItems.size() != 0){
							// ページナビゲーションがなければ右側リストにエリア移動
							command = this.COMMAND_MOVE_AREA;
							movetoItems = this.listItems;
							movetoIndexForMoveArea = 0;
							movetoPositionStatus = this.POSITION_LIST;

						}else{
							// 右側リストもなければ、左側ナビゲーションにエリア移動
							command = this.COMMAND_MOVE_AREA;
							movetoItems = this.menuItems;
							movetoIndexForMoveArea = 0;
							movetoPositionStatus = this.POSITION_MENU;
						}

					}else if(this.PositionStatus != this.POSITION_SEARCH){
						// 現在位置が検索ページ遷移以外であれば、次に進む
						command = this.COMMAND_FORWARD;
					}

					break;
			}

			// moveFocusメソッドからはキー操作実行可否を表すbooleanが返るので、そのまま本メソッドの戻り値とする
			return this.moveFocus(command, targetItems, movetoItems, movetoIndexForMoveArea, movetoPositionStatus);
		},

		// 指定のコマンドに基づいてフォーカス位置を計算し、フォーカスを移動する
		moveFocus: function(command, targetItems, movetoItems, movetoIndexForMoveArea, movetoPositionStatus){
			// キー操作実行可否判定のためのbooleanを戻り値とする
			var returnValue = true;

			switch(command){
				case this.COMMAND_FORWARD: // 進む
					// 1つ次のフォーカス位置を取得する
					var movetoIndex = this.getNextPositionIndex(targetItems, this.cursorPositionIndex);

					if(movetoIndex != this.cursorPositionIndex){
						// 取得した位置にフォーカスを当てる
						targetItems.eq(movetoIndex).focus();
						this.cursorPositionIndex = movetoIndex;

						// キー操作はキャンセルする（スクロール防止）
						returnValue = false;
					}

					break;

				case this.COMMAND_BACK: // 戻る
					// 1つ前のフォーカス位置を取得する
					var movetoIndex = this.getPreviousPositionIndex(targetItems, this.cursorPositionIndex);

					if(movetoIndex != this.cursorPositionIndex){
						// 取得した位置にフォーカスを当てる
						targetItems.eq(movetoIndex).focus();
						this.cursorPositionIndex = movetoIndex;

						// キー操作はキャンセルする（スクロール防止）
						returnValue = false;
					}

					break;

				case this.COMMAND_MOVE_AREA: // エリア移動
					if(movetoItems != null){
						// 隣接エリアにフォーカスを移動する
						this.setFocusForMoveArea(movetoItems, movetoIndexForMoveArea, movetoPositionStatus);

						// キー操作はキャンセルする（スクロール防止）
						returnValue = false;
					}

					break;
			}

			return returnValue;
		},

		// targetItems内で、positionIndexの前の位置となるフォーカス対象のindexを返す
		getPreviousPositionIndex: function(targetItems, positionIndex) {
			// 初期値は現在位置から1つ前
			var previousPositionIndex = positionIndex-1;

			// 現在位置が0より大きいときに1つ前を探索する
			if(positionIndex > 0){

				// 画面に表示されているか、探索位置が0以下になるまで遡る
				while(targetItems.eq(previousPositionIndex).is(":hidden") && previousPositionIndex > 0){
					previousPositionIndex--;
				}

				// 検出位置が画面に表示されていないときは、初期位置から動かさない
				if(targetItems.eq(previousPositionIndex).is(":hidden")){
					previousPositionIndex = positionIndex;
				}

			}else{
				// 現在位置が0以下のときはフォーカス位置を0で固定
				previousPositionIndex = 0;
			}

			return previousPositionIndex;
		},

		// targetItems内で、positionIndexの次の位置となるフォーカス対象のindexを返す
		getNextPositionIndex: function(targetItems, positionIndex) {
			// 初期値は現在位置から1つ次
			var nextPositionIndex = positionIndex+1;

			// 現在位置が最大値未満のときに1つ次を探索する
			if(nextPositionIndex < targetItems.length){

				// 画面に表示されているか、探索位置が最大値になるまで進む
				while(targetItems.eq(nextPositionIndex).is(":hidden") && nextPositionIndex < targetItems.length-1){
					nextPositionIndex++;
				}

				// 検出位置が画面に表示されていないときは、初期値位置から動かさない
				if(targetItems.eq(nextPositionIndex).is(":hidden")){
					nextPositionIndex = positionIndex;
				}

			}else{
				// 現在位置が最大値のときはフォーカス位置を最大値で固定
				nextPositionIndex = targetItems.length-1;
			}

			return nextPositionIndex;
		},

		// ファイルが格納されているフォルダ名を返す
		// フォルダ名の判定は、リンクパスが保証されているcover, contents, searchのみで使用すること
		getLastFolderName: function() {
			var lastFolderName = "";
			var url = window.location.pathname;
			var comp = url.split('/');
			lastFolderName = url.match(/\.html$/) ? comp[comp.length - 2] : comp[comp.length - 1];

			return lastFolderName;
		}
	};
	new NMP.Controller();
});
