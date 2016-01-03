function deleteMember(id, page){
	var isDelete = confirm('삭제 하시겠습니까?');
	if(isDelete){
		var redirect = '/admin/member/' + page;
		location.href='/admin/member/delete_process/' + id + '?redirect=' + redirect;
	}
}